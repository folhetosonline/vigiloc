# Script para Comprimir Vídeos para Upload no VigiLoc

## Requisitos
- FFmpeg instalado no sistema

## Instalação do FFmpeg

### Windows:
1. Baixe de: https://ffmpeg.org/download.html
2. Extraia e adicione ao PATH

### Mac:
```bash
brew install ffmpeg
```

### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg
```

## Como Usar

### 1. Compressão Básica (Recomendado)
```bash
ffmpeg -i input.mov -c:v libx264 -preset medium -crf 23 -vf scale=1920:1080 -c:a aac -b:a 128k -movflags +faststart output.mp4
```

### 2. Compressão Alta (Menor Arquivo)
```bash
ffmpeg -i input.mov -c:v libx264 -preset slow -crf 28 -vf scale=1920:1080 -c:a aac -b:a 96k -movflags +faststart output.mp4
```

### 3. Compressão Rápida
```bash
ffmpeg -i input.mov -c:v libx264 -preset fast -crf 23 -vf scale=1920:1080 -c:a aac -b:a 128k -movflags +faststart output.mp4
```

### 4. Apenas Redimensionar (Sem Re-encode)
```bash
ffmpeg -i input.mp4 -vf scale=1920:1080 -c:a copy output.mp4
```

### 5. Remover Áudio (Menor Arquivo)
```bash
ffmpeg -i input.mov -c:v libx264 -preset medium -crf 23 -vf scale=1920:1080 -an -movflags +faststart output.mp4
```

## Parâmetros Explicados

- `-i input.mov` - Arquivo de entrada
- `-c:v libx264` - Codec de vídeo H.264
- `-preset medium` - Velocidade de compressão (ultrafast, fast, medium, slow, veryslow)
- `-crf 23` - Qualidade (18=alta, 23=ótima, 28=boa, menor número = maior qualidade)
- `-vf scale=1920:1080` - Redimensionar para Full HD
- `-c:a aac` - Codec de áudio
- `-b:a 128k` - Bitrate de áudio
- `-movflags +faststart` - Otimização para streaming web
- `-an` - Remove áudio completamente

## Verificar Informações do Vídeo
```bash
ffmpeg -i input.mov
```

## Verificar Tamanho do Arquivo
```bash
# Windows
dir input.mp4
# Mac/Linux
ls -lh input.mp4
```

## Tamanhos Alvo

- **Ideal:** 5-10 MB
- **Aceitável:** 10-30 MB
- **Máximo:** 100 MB

## Exemplo Prático

### Vídeo de 50MB para ~8MB:
```bash
ffmpeg -i vigiloc-video.mov \
  -c:v libx264 \
  -preset slow \
  -crf 28 \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2" \
  -c:a aac \
  -b:a 96k \
  -movflags +faststart \
  -t 15 \
  vigiloc-compressed.mp4
```

Parâmetros extras:
- `-t 15` - Limita a 15 segundos (opcional)
- `force_original_aspect_ratio=decrease` - Mantém proporção
- `pad=1920:1080` - Adiciona bordas pretas se necessário

## Dicas

1. **Teste primeiro:** Use `-t 10` para processar apenas 10 segundos e testar
2. **CRF:** Comece com 23, aumente para 28 se ainda estiver grande
3. **Preset:** Use "slow" para melhor compressão, "fast" para velocidade
4. **Áudio:** Se o vídeo não precisa de áudio, use `-an` para economizar ~20-30%
5. **Duração:** Vídeos curtos (5-15s) são ideais para banners

## Troubleshooting

### "command not found"
- FFmpeg não está instalado ou não está no PATH

### Arquivo ainda muito grande
- Aumente o CRF para 30
- Reduza resolução: scale=1280:720
- Remova áudio com `-an`
- Reduza duração com `-t 10`

### Qualidade ruim
- Reduza o CRF para 20
- Use preset "slow" ou "veryslow"
- Mantenha áudio com bitrate 128k

## Upload no VigiLoc

1. Comprima o vídeo seguindo as instruções acima
2. Acesse: `/admin/banners`
3. Clique: "Novo Banner"
4. Selecione: "Vídeo" como tipo de mídia
5. Faça upload do arquivo comprimido
6. Configure título, subtítulo e ordem
7. Salve e ative

**Limite:** 100 MB
**Recomendado:** < 10 MB para melhor performance
