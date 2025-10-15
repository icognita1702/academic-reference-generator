# Guia de Publicação na Chrome Web Store

## Pré-requisitos

1. **Conta Google**: Necessária para acessar o Chrome Web Store Developer Dashboard
2. **Taxa de Registro**: USD $5 (taxa única para desenvolvedor)
3. **Extensão Testada**: Verificar funcionamento em diferentes sites e cenários

## Passos para Publicação

### 1. Preparar Arquivos

**Criar arquivo ZIP com:**
```
academic-reference-generator.zip
├── manifest.json
├── popup.html
├── background.js
├── content.js
├── styles/
│   └── popup.css
├── scripts/
│   └── popup.js
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

### 2. Preparar Materiais de Marketing

#### Screenshots Obrigatórias
- **1280x800px**: Screenshot principal da interface
- **640x400px**: Screenshot secundária (opcional)
- **Formatos**: PNG ou JPEG
- **Conteúdo**: Interface da extensão em uso real

#### Ícone da Store
- **128x128px**: Ícone principal (já temos)
- **Formato**: PNG com fundo transparente

#### Descrição Sugerida

**Título:** Gerador Automático de Referências Acadêmicas

**Resumo (132 caracteres):**
Gera referências ABNT, APA, Vancouver, Chicago, MLA e IEEE automaticamente. Ideal para estudantes e pesquisadores.

**Descrição Detalhada:**
```
🎓 Gerador Automático de Referências Acadêmicas

Extensão essencial para estudantes e pesquisadores que converte informações de páginas web em referências acadêmicas prontas em múltiplos formatos.

✨ RECURSOS PRINCIPAIS:
• Extração automática de metadados (título, autores, ano, URL)
• Suporte a 6 formatos: ABNT, APA, Vancouver, Chicago, MLA, IEEE
• Entrada manual para complementar informações
• Exportação BibTeX (.bib) e RIS (.ris) para gerenciadores de referência
• Histórico de referências geradas
• Interface moderna e intuitiva

📚 FORMATOS SUPORTADOS:
• ABNT (Brasil)
• APA (Psicologia, Educação)
• Vancouver (Medicina, Ciências)
• Chicago (História, Literatura)
• MLA (Literatura, Humanidades)
• IEEE (Engenharia, Tecnologia)

🚀 COMO USAR:
1. Navegue para a página que deseja referenciar
2. Clique no ícone da extensão
3. Verifique os dados coletados automaticamente
4. Selecione o formato desejado
5. Gere e copie sua referência pronta

🔧 COMPATIBILIDADE:
• Zotero, Mendeley, EndNote (via BibTeX/RIS)
• Funciona com artigos científicos, notícias, blogs e sites
• Detecção automática de DOI quando disponível

Perfeito para TCCs, dissertações, teses e trabalhos acadêmicos!
```

### 3. Acessar Chrome Web Store Developer Dashboard

1. Acesse: https://chrome.google.com/webstore/devconsole
2. Faça login com sua conta Google
3. Pague a taxa de registro de $5 (se ainda não fez)
4. Clique em "Add new item"

### 4. Upload e Configuração

#### Upload do ZIP
- Faça upload do arquivo ZIP da extensão
- Aguarde verificação automática

#### Preenchimento de Dados
- **Título**: Gerador Automático de Referências Acadêmicas
- **Resumo**: (usar o resumo acima)
- **Descrição**: (usar a descrição detalhada acima)
- **Categoria**: Productivity
- **Idioma**: Portuguese (Brazil)

#### Screenshots e Ícones
- Upload das screenshots da interface
- Confirmar ícone 128x128px

#### Configurações de Privacidade
- **Single Purpose**: "Gera referências acadêmicas a partir de páginas web"
- **Permissions Justification**: 
  - `activeTab`: "Necessário para acessar metadados da página atual"
  - `storage`: "Armazena histórico de referências localmente"
  - `scripting`: "Executa scripts para coletar metadados da página"

### 5. Políticas de Privacidade

**Criar arquivo de política (obrigatório):**

```
Política de Privacidade - Gerador de Referências Acadêmicas

1. COLETA DE DADOS
Esta extensão coleta apenas metadados públicos das páginas web visitadas (título, URL, autor, ano) para gerar referências acadêmicas.

2. ARMAZENAMENTO
Todos os dados são armazenados localmente no dispositivo do usuário. Nenhuma informação é enviada para servidores externos.

3. COMPARTILHAMENTO
Não compartilhamos, vendemos ou transferimos dados pessoais para terceiros.

4. SEGURANÇA
Os dados ficam armazenados apenas no navegador do usuário e podem ser removidos a qualquer momento desinstalando a extensão.

5. CONTATO
Para questões sobre privacidade: filipesouza0299@gmail.com
```

Hostar em: GitHub Pages, seu site pessoal, ou Google Sites

### 6. Submissão para Revisão

1. **Revisar todas as informações**
2. **Submeter para revisão**
3. **Aguardar aprovação** (normalmente 1-3 dias úteis)

### 7. Pós-Publicação

#### Monitoramento
- Acompanhar reviews dos usuários
- Verificar estatísticas de uso
- Responder a feedback

#### Atualizações
- Para atualizar: fazer upload de novo ZIP com `version` incrementada no manifest.json
- Descrever changelog na descrição da atualização

## Checklist Final

- [ ] Arquivo ZIP criado e testado
- [ ] Screenshots em alta qualidade (1280x800px)
- [ ] Ícone 128x128px otimizado
- [ ] Política de privacidade publicada online
- [ ] Descrição e resumo revisados
- [ ] Permissões justificadas
- [ ] Taxa de desenvolvedor paga
- [ ] Testado em diferentes sites

## Dicas Importantes

1. **Teste antes de publicar**: Use em diferentes sites (artigos, notícias, blogs)
2. **Screenshots de qualidade**: Mostre a extensão em ação real
3. **Descrição clara**: Foque nos benefícios para estudantes
4. **Keywords relevantes**: Use termos como "referências", "ABNT", "APA", "acadêmico"
5. **Responda reviews**: Engajamento melhora classificação

## Recursos Adicionais

- [Políticas do Chrome Web Store](https://developer.chrome.com/docs/webstore/program-policies/)
- [Guia de Qualidade](https://developer.chrome.com/docs/webstore/quality-guidelines/)
- [Central de Ajuda](https://support.google.com/chrome_webstore/)

---

**Status Estimado**: Pronto para submissão após criar screenshots e política de privacidade.