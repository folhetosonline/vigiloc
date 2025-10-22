# CRM/ERP Routes - Para adicionar ao server.py

# ==================== CUSTOMER ROUTES ====================

@api_router.get("/admin/customers", response_model=List[Customer])
async def get_customers(current_user: User = Depends(get_current_admin)):
    customers = await db.customers.find({}, {"_id": 0}).to_list(1000)
    for customer in customers:
        if isinstance(customer.get('created_at'), str):
            customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return customers

@api_router.post("/admin/customers", response_model=Customer)
async def create_customer(customer_data: dict, current_user: User = Depends(get_current_admin)):
    customer = Customer(**customer_data)
    doc = customer.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.customers.insert_one(doc)
    return customer

@api_router.put("/admin/customers/{customer_id}", response_model=Customer)
async def update_customer(customer_id: str, customer_data: dict, current_user: User = Depends(get_current_admin)):
    result = await db.customers.update_one({"id": customer_id}, {"$set": customer_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Cliente não encontrado")
    customer = await db.customers.find_one({"id": customer_id}, {"_id": 0})
    if isinstance(customer.get('created_at'), str):
        customer['created_at'] = datetime.fromisoformat(customer['created_at'])
    return Customer(**customer)

# ==================== CONTRACT ROUTES ====================

@api_router.get("/admin/contracts", response_model=List[Contract])
async def get_contracts(current_user: User = Depends(get_current_admin)):
    contracts = await db.contracts.find({}, {"_id": 0}).to_list(1000)
    for contract in contracts:
        for field in ['created_at', 'start_date', 'end_date']:
            if contract.get(field) and isinstance(contract[field], str):
                contract[field] = datetime.fromisoformat(contract[field])
    return contracts

@api_router.post("/admin/contracts", response_model=Contract)
async def create_contract(contract_data: dict, current_user: User = Depends(get_current_admin)):
    # Generate contract number
    count = await db.contracts.count_documents({})
    contract_data['contract_number'] = f"CTR-{datetime.now().year}-{count+1:04d}"
    
    contract = Contract(**contract_data)
    doc = contract.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['start_date'] = doc['start_date'].isoformat()
    if doc.get('end_date'):
        doc['end_date'] = doc['end_date'].isoformat()
    
    await db.contracts.insert_one(doc)
    return contract

# ==================== EQUIPMENT ROUTES ====================

@api_router.get("/admin/equipment", response_model=List[Equipment])
async def get_equipment(customer_id: Optional[str] = None, current_user: User = Depends(get_current_admin)):
    query = {"customer_id": customer_id} if customer_id else {}
    equipment = await db.equipment.find(query, {"_id": 0}).to_list(1000)
    for eq in equipment:
        for field in ['installation_date', 'warranty_until']:
            if eq.get(field) and isinstance(eq[field], str):
                eq[field] = datetime.fromisoformat(eq[field])
    return equipment

@api_router.post("/admin/equipment", response_model=Equipment)
async def create_equipment(equipment_data: dict, current_user: User = Depends(get_current_admin)):
    equipment = Equipment(**equipment_data)
    doc = equipment.model_dump()
    doc['installation_date'] = doc['installation_date'].isoformat()
    if doc.get('warranty_until'):
        doc['warranty_until'] = doc['warranty_until'].isoformat()
    await db.equipment.insert_one(doc)
    return equipment

# ==================== MAINTENANCE TICKET ROUTES ====================

@api_router.get("/admin/tickets", response_model=List[MaintenanceTicket])
async def get_tickets(status: Optional[str] = None, current_user: User = Depends(get_current_admin)):
    query = {"status": status} if status else {}
    tickets = await db.tickets.find(query, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for ticket in tickets:
        for field in ['created_at', 'updated_at', 'resolved_at']:
            if ticket.get(field) and isinstance(ticket[field], str):
                ticket[field] = datetime.fromisoformat(ticket[field])
    return tickets

@api_router.post("/admin/tickets", response_model=MaintenanceTicket)
async def create_ticket(ticket_data: dict, current_user: User = Depends(get_current_admin)):
    count = await db.tickets.count_documents({})
    ticket_data['ticket_number'] = f"TKT-{datetime.now().year}-{count+1:05d}"
    
    ticket = MaintenanceTicket(**ticket_data)
    doc = ticket.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    if doc.get('resolved_at'):
        doc['resolved_at'] = doc['resolved_at'].isoformat()
    
    await db.tickets.insert_one(doc)
    return ticket

@api_router.put("/admin/tickets/{ticket_id}", response_model=MaintenanceTicket)
async def update_ticket(ticket_id: str, ticket_data: dict, current_user: User = Depends(get_current_admin)):
    ticket_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    result = await db.tickets.update_one({"id": ticket_id}, {"$set": ticket_data})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Chamado não encontrado")
    ticket = await db.tickets.find_one({"id": ticket_id}, {"_id": 0})
    for field in ['created_at', 'updated_at', 'resolved_at']:
        if ticket.get(field) and isinstance(ticket[field], str):
            ticket[field] = datetime.fromisoformat(ticket[field])
    return MaintenanceTicket(**ticket)

# ==================== PAYMENT ROUTES ====================

@api_router.get("/admin/payments", response_model=List[Payment])
async def get_payments(status: Optional[str] = None, current_user: User = Depends(get_current_admin)):
    query = {"status": status} if status else {}
    payments = await db.payments.find(query, {"_id": 0}).sort("due_date", -1).to_list(1000)
    for payment in payments:
        for field in ['due_date', 'paid_at', 'created_at']:
            if payment.get(field) and isinstance(payment[field], str):
                payment[field] = datetime.fromisoformat(payment[field])
    return payments

@api_router.post("/admin/payments/generate-monthly")
async def generate_monthly_payments(current_user: User = Depends(get_current_admin)):
    """Generate monthly payments for all active contracts"""
    contracts = await db.contracts.find({"status": "active"}, {"_id": 0}).to_list(1000)
    
    generated = 0
    for contract in contracts:
        # Check if payment for this month already exists
        current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        existing = await db.payments.find_one({
            "contract_id": contract['id'],
            "due_date": {"$gte": current_month.isoformat()}
        })
        
        if not existing:
            payment_day = contract.get('payment_day', 10)
            due_date = datetime.now().replace(day=payment_day, hour=0, minute=0, second=0, microsecond=0)
            
            payment = Payment(
                customer_id=contract['customer_id'],
                contract_id=contract['id'],
                invoice_number=f"INV-{datetime.now().year}{datetime.now().month:02d}-{generated+1:04d}",
                amount=contract['monthly_value'],
                due_date=due_date,
                status="pending"
            )
            
            doc = payment.model_dump()
            doc['due_date'] = doc['due_date'].isoformat()
            doc['created_at'] = doc['created_at'].isoformat()
            
            await db.payments.insert_one(doc)
            generated += 1
    
    return {"message": f"{generated} pagamentos gerados"}

@api_router.post("/admin/payments/{payment_id}/mark-paid")
async def mark_payment_paid(payment_id: str, payment_method: str, current_user: User = Depends(get_current_admin)):
    result = await db.payments.update_one(
        {"id": payment_id},
        {"$set": {
            "status": "paid",
            "paid_at": datetime.now(timezone.utc).isoformat(),
            "payment_method": payment_method
        }}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Pagamento não encontrado")
    return {"message": "Pagamento marcado como pago"}

# ==================== PAGE CONTENT ROUTES ====================

@api_router.get("/page-content/{page_name}")
async def get_page_content(page_name: str):
    content = await db.page_content.find_one({"page_name": page_name}, {"_id": 0})
    if not content:
        # Return default empty structure
        content = {
            "id": page_name,
            "page_name": page_name,
            "sections": {},
            "images": {},
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
    return content

@api_router.put("/admin/page-content/{page_name}")
async def update_page_content(page_name: str, content_data: dict, current_user: User = Depends(get_current_admin)):
    content_data['page_name'] = page_name
    content_data['updated_at'] = datetime.now(timezone.utc).isoformat()
    
    await db.page_content.update_one(
        {"page_name": page_name},
        {"$set": content_data},
        upsert=True
    )
    return {"message": "Conteúdo atualizado"}

# ==================== NOTIFICATION/AUTOMATION ROUTES ====================

@api_router.post("/admin/notifications/send-payment-reminders")
async def send_payment_reminders(current_user: User = Depends(get_current_admin)):
    """Send payment reminders 1 day before due date"""
    tomorrow = datetime.now() + timedelta(days=1)
    tomorrow_start = tomorrow.replace(hour=0, minute=0, second=0, microsecond=0)
    tomorrow_end = tomorrow.replace(hour=23, minute=59, second=59)
    
    payments = await db.payments.find({
        "status": "pending",
        "reminder_sent": False,
        "due_date": {
            "$gte": tomorrow_start.isoformat(),
            "$lte": tomorrow_end.isoformat()
        }
    }, {"_id": 0}).to_list(1000)
    
    sent = 0
    for payment in payments:
        customer = await db.customers.find_one({"id": payment['customer_id']}, {"_id": 0})
        if customer:
            # Create notification
            notification = Notification(
                customer_id=customer['id'],
                type="payment_reminder",
                channel="whatsapp",
                message=f"Olá {customer['name']}! Lembrete: Seu pagamento de R$ {payment['amount']:.2f} vence amanhã ({payment['due_date'][:10]}). PIX: {payment.get('pix_key', 'Ver fatura')}"
            )
            
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
            
            # Mark as sent
            await db.payments.update_one({"id": payment['id']}, {"$set": {"reminder_sent": True}})
            sent += 1
    
    return {"message": f"{sent} lembretes agendados"}

@api_router.post("/admin/notifications/send-overdue-notices")
async def send_overdue_notices(current_user: User = Depends(get_current_admin)):
    """Send overdue notices 3 days after due date"""
    three_days_ago = datetime.now() - timedelta(days=3)
    
    payments = await db.payments.find({
        "status": "pending",
        "overdue_notice_sent": False,
        "due_date": {"$lt": three_days_ago.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    sent = 0
    for payment in payments:
        customer = await db.customers.find_one({"id": payment['customer_id']}, {"_id": 0})
        if customer:
            notification = Notification(
                customer_id=customer['id'],
                type="overdue",
                channel="whatsapp",
                message=f"⚠️ {customer['name']}, seu pagamento de R$ {payment['amount']:.2f} está atrasado há 3 dias. Por favor, regularize para evitar suspensão do serviço."
            )
            
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
            
            await db.payments.update_one({"id": payment['id']}, {"$set": {"overdue_notice_sent": True, "status": "overdue"}})
            sent += 1
    
    return {"message": f"{sent} avisos de atraso enviados"}

@api_router.post("/admin/notifications/send-suspension-warnings")
async def send_suspension_warnings(current_user: User = Depends(get_current_admin)):
    """Send suspension warnings 10 days after due date"""
    ten_days_ago = datetime.now() - timedelta(days=10)
    
    payments = await db.payments.find({
        "status": "overdue",
        "suspension_notice_sent": False,
        "due_date": {"$lt": ten_days_ago.isoformat()}
    }, {"_id": 0}).to_list(1000)
    
    sent = 0
    for payment in payments:
        customer = await db.customers.find_one({"id": payment['customer_id']}, {"_id": 0})
        if customer:
            notification = Notification(
                customer_id=customer['id'],
                type="suspension",
                channel="whatsapp",
                message=f"🚨 AVISO FINAL {customer['name']}: Seu serviço será suspenso em 24h por falta de pagamento. Valor: R$ {payment['amount']:.2f}. Regularize URGENTE!"
            )
            
            notif_doc = notification.model_dump()
            notif_doc['created_at'] = notif_doc['created_at'].isoformat()
            await db.notifications.insert_one(notif_doc)
            
            await db.payments.update_one({"id": payment['id']}, {"$set": {"suspension_notice_sent": True}})
            
            # Update customer status to suspended
            await db.customers.update_one({"id": customer['id']}, {"$set": {"status": "suspended"}})
            sent += 1
    
    return {"message": f"{sent} avisos de suspensão enviados"}

@api_router.get("/admin/notifications", response_model=List[Notification])
async def get_notifications(current_user: User = Depends(get_current_admin)):
    notifications = await db.notifications.find({}, {"_id": 0}).sort("created_at", -1).limit(100).to_list(100)
    for notif in notifications:
        for field in ['created_at', 'sent_at']:
            if notif.get(field) and isinstance(notif[field], str):
                notif[field] = datetime.fromisoformat(notif[field])
    return notifications
