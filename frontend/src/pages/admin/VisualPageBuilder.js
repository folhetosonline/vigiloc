import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GripVertical, Plus, Trash2, Eye, Save, Settings, Sparkles } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { API } from "@/App";
import PageTemplates from "./PageTemplates";

// Componente arrastável
const SortableComponent = ({ id, component, onUpdate, onDelete, products }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className="mb-4">
      <Card className="p-4">
        <div className="flex items-start gap-3">
          <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing mt-1">
            <GripVertical className="w-5 h-5 text-gray-400" />
          </button>
          
          <div className="flex-1">
            <ComponentEditor 
              component={component} 
              onUpdate={onUpdate}
              products={products}
            />
          </div>
          
          <Button
            variant="destructive"
            size="icon"
            onClick={onDelete}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
};

// Editor de componente individual
const ComponentEditor = ({ component, onUpdate, products }) => {
  const handleChange = (field, value) => {
    onUpdate({ ...component, [field]: value });
  };

  const renderEditor = () => {
    switch (component.type) {
      case 'hero':
        return (
          <div className="space-y-3">
            <div className="font-semibold text-blue-600">🎯 Hero Section</div>
            <Input
              placeholder="Título"
              value={component.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            <Textarea
              placeholder="Subtítulo"
              value={component.subtitle || ''}
              onChange={(e) => handleChange('subtitle', e.target.value)}
              rows={2}
            />
            <Input
              placeholder="URL da Imagem"
              value={component.image || ''}
              onChange={(e) => handleChange('image', e.target.value)}
            />
            <Input
              placeholder="Texto do Botão WhatsApp"
              value={component.buttonText || 'Fale Conosco'}
              onChange={(e) => handleChange('buttonText', e.target.value)}
            />
          </div>
        );
      
      case 'product':
        return (
          <div className="space-y-3">
            <div className="font-semibold text-green-600">📦 Produto Customizável</div>
            <select
              className="w-full border rounded p-2"
              value={component.productId || ''}
              onChange={(e) => {
                const product = products.find(p => p.id === e.target.value);
                handleChange('productId', e.target.value);
                if (product) {
                  handleChange('title', product.name);
                  handleChange('description', product.description);
                  handleChange('image', product.image);
                  handleChange('price', product.price);
                }
              }}
            >
              <option value="">Selecionar produto do catálogo</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            
            <Input
              placeholder="Título (override)"
              value={component.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            <Textarea
              placeholder="Descrição (override)"
              value={component.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
            <Input
              placeholder="URL da Imagem (override)"
              value={component.image || ''}
              onChange={(e) => handleChange('image', e.target.value)}
            />
            <Input
              type="number"
              placeholder="Preço (override)"
              value={component.price || ''}
              onChange={(e) => handleChange('price', parseFloat(e.target.value))}
            />
            <Input
              placeholder="Texto do Botão WhatsApp"
              value={component.whatsappText || 'Solicitar Orçamento'}
              onChange={(e) => handleChange('whatsappText', e.target.value)}
            />
          </div>
        );
      
      case 'text':
        return (
          <div className="space-y-3">
            <div className="font-semibold text-purple-600">📝 Bloco de Texto</div>
            <Input
              placeholder="Título"
              value={component.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            <Textarea
              placeholder="Conteúdo"
              value={component.content || ''}
              onChange={(e) => handleChange('content', e.target.value)}
              rows={4}
            />
          </div>
        );
      
      case 'cta':
        return (
          <div className="space-y-3">
            <div className="font-semibold text-orange-600">🎯 Call to Action</div>
            <Input
              placeholder="Título"
              value={component.title || ''}
              onChange={(e) => handleChange('title', e.target.value)}
            />
            <Textarea
              placeholder="Descrição"
              value={component.description || ''}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={2}
            />
            <Input
              placeholder="Texto do Botão"
              value={component.buttonText || 'Entre em Contato'}
              onChange={(e) => handleChange('buttonText', e.target.value)}
            />
          </div>
        );
      
      default:
        return <div>Tipo desconhecido: {component.type}</div>;
    }
  };

  return renderEditor();
};

const VisualPageBuilder = () => {
  const [components, setComponents] = useState([]);
  const [products, setProducts] = useState([]);
  const [pageTitle, setPageTitle] = useState('');
  const [pageSlug, setPageSlug] = useState('');
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/products`);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setComponents((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addComponent = (type) => {
    const newComponent = {
      id: `component-${Date.now()}`,
      type,
      title: '',
      subtitle: '',
      content: '',
      description: '',
      image: '',
      buttonText: '',
      whatsappText: '',
      productId: '',
      price: 0
    };
    setComponents([...components, newComponent]);
  };

  const updateComponent = (index, updatedComponent) => {
    const newComponents = [...components];
    newComponents[index] = updatedComponent;
    setComponents(newComponents);
  };

  const deleteComponent = (index) => {
    setComponents(components.filter((_, i) => i !== index));
  };

  const savePage = async () => {
    if (!pageTitle || !pageSlug) {
      toast.error('Título e slug são obrigatórios');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API}/admin/pages`, {
        title: pageTitle,
        slug: pageSlug,
        components: components,
        published: false
      });
      toast.success('Página salva com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar página');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-4">Visual Page Builder</h1>
        
        <Tabs defaultValue="builder" className="w-full">
          <TabsList>
            <TabsTrigger value="builder">Editor</TabsTrigger>
            <TabsTrigger value="templates">
              <Sparkles className="w-4 h-4 mr-2" />
              Templates Prontos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="templates">
            <PageTemplates onApplyTemplate={(templateComponents) => {
              setComponents(templateComponents);
              toast.success('Template aplicado! Personalize como quiser.');
            }} />
          </TabsContent>

          <TabsContent value="builder">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <Input
                placeholder="Título da Página"
                value={pageTitle}
                onChange={(e) => setPageTitle(e.target.value)}
              />
              <div>
                <Input
                  placeholder="Slug (URL)"
                  value={pageSlug}
                  onChange={(e) => setPageSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                />
                {pageSlug && (
                  <p className="text-xs text-gray-500 mt-1">
                    URL: <span className="text-blue-600">/p/{pageSlug}</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 mb-6">
              <Button onClick={() => addComponent('hero')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Hero
              </Button>
              <Button onClick={() => addComponent('product')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Produto
              </Button>
              <Button onClick={() => addComponent('text')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Texto
              </Button>
              <Button onClick={() => addComponent('cta')} variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                CTA
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Editor */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Editor</h2>
                {components.length === 0 ? (
                  <Card className="p-8 text-center text-gray-500">
                    Adicione componentes ou use um template pronto
                  </Card>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={components.map(c => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {components.map((component, index) => (
                        <SortableComponent
                          key={component.id}
                          id={component.id}
                          component={component}
                          products={products}
                          onUpdate={(updated) => updateComponent(index, updated)}
                          onDelete={() => deleteComponent(index)}
                        />
                      ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>

              {/* Preview */}
              <div>
                <h2 className="text-xl font-semibold mb-4">Preview</h2>
                <Card className="p-4 bg-gray-50">
                  <PagePreview components={components} />
                </Card>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              {pageSlug && (
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`/p/${pageSlug}`, '_blank')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Ver Página
                </Button>
              )}
              <Button onClick={savePage} disabled={loading}>
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Salvando...' : 'Salvar Página'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

// Preview da página
const PagePreview = ({ components }) => {
  return (
    <div className="space-y-4">
      {components.map((component, index) => (
        <div key={index} className="border rounded p-4 bg-white">
          {component.type === 'hero' && (
            <div>
              <h1 className="text-2xl font-bold">{component.title || 'Título Hero'}</h1>
              <p className="text-gray-600">{component.subtitle || 'Subtítulo'}</p>
              {component.image && <div className="bg-gray-200 h-32 mt-2 rounded flex items-center justify-center">Imagem</div>}
              <button className="mt-2 bg-green-500 text-white px-4 py-2 rounded">
                {component.buttonText || 'Botão'}
              </button>
            </div>
          )}
          
          {component.type === 'product' && (
            <div>
              <h3 className="font-bold">{component.title || 'Nome do Produto'}</h3>
              <p className="text-sm text-gray-600">{component.description || 'Descrição'}</p>
              <p className="text-lg font-bold text-green-600">R$ {(component.price || 0).toFixed(2)}</p>
              <button className="mt-2 bg-green-500 text-white px-3 py-1 rounded text-sm">
                {component.whatsappText || 'WhatsApp'}
              </button>
            </div>
          )}
          
          {component.type === 'text' && (
            <div>
              <h3 className="font-bold">{component.title || 'Título'}</h3>
              <p className="text-gray-700">{component.content || 'Conteúdo do texto'}</p>
            </div>
          )}
          
          {component.type === 'cta' && (
            <div className="bg-blue-50 p-4 rounded text-center">
              <h3 className="font-bold text-xl">{component.title || 'Título CTA'}</h3>
              <p className="text-gray-700">{component.description || 'Descrição'}</p>
              <button className="mt-2 bg-blue-600 text-white px-6 py-2 rounded">
                {component.buttonText || 'Botão'}
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default VisualPageBuilder;
