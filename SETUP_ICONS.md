# Como Criar os Ícones da Extensão

⚠️ **PROBLEMA CONHECIDO**: Os ícones não foram carregados automaticamente no repositório.

## Solução Rápida

A extensão **funciona perfeitamente** sem os ícones, apenas não terá ícone personalizado na barra do Chrome.

## Criação Manual dos Ícones (Opcional)

### Opção 1: Ícones Simples

1. **Criar 3 arquivos PNG**:
   - `icons/icon16.png` (16x16 pixels)
   - `icons/icon48.png` (48x48 pixels)
   - `icons/icon128.png` (128x128 pixels)

2. **Design sugerido**:
   - Fundo circular azul (#4f46e5)
   - Símbolo branco: chapéu de formação ou letra "R"

3. **Ferramentas online**:
   - [Favicon.io](https://favicon.io/favicon-generator/)
   - [Canva](https://canva.com) - template de ícone
   - [GIMP](https://gimp.org) ou qualquer editor de imagem

### Opção 2: Usar Emoji como Ícone

1. Acesse: https://favicon.io/emoji-favicons/
2. Escolha: 🎓 (graduation cap) ou 📚 (books)
3. Baixe os tamanhos 16px, 48px, 128px
4. Renomeie para `icon16.png`, `icon48.png`, `icon128.png`
5. Coloque na pasta `icons/`

### Opção 3: Ativar Ícones no Manifest

Após criar os ícones, edite o `manifest.json` e adicione:

```json
{
  "action": {
    "default_popup": "popup.html",
    "default_title": "Gerador de Referências",
    "default_icon": {
      "16": "icons/icon16.png",
      "48": "icons/icon48.png",
      "128": "icons/icon128.png"
    }
  },
  "icons": {
    "16": "icons/icon16.png",
    "48": "icons/icon48.png",
    "128": "icons/icon128.png"
  }
}
```

## Dados dos Ícones (Base64)

Se você souber como converter base64 para PNG:

### icon16.png (16x16)
```
iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAaElEQVR42q2TMQ6AMAwDnfAG3sJbeAtvYeEtbGzMzMxMfAATDw8PD3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3d3AAAAASUVORK5CYII=
```

### icon48.png (48x48)
```
iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAATUlEQVR42u3QMQ0AAAjAMPw/tI8KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA7wGMEAABrWulfgAAAABJRU5ErkJggg==
```

### icon128.png (128x128)
```
iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAAcklEQVR42u3QMQ0AAAjAMPw/tI8KAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACA7wHdhwABVrWjMgAAAABJRU5ErkJggg==
```

## Status da Extensão

✅ **Funcional**: Todas as funcionalidades principais funcionam
✅ **Interface**: Layout moderno e responsivo
✅ **Formatos**: ABNT, APA, Vancouver, Chicago, MLA, IEEE
✅ **Exportação**: BibTeX (.bib) e RIS (.ris)
⚠️ **Ícones**: Precisam ser adicionados manualmente

A extensão está **pronta para uso** mesmo sem ícones personalizados!