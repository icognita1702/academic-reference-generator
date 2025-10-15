# Gerador Automático de Referências Acadêmicas

> Extensão Chrome para geração automática de referências acadêmicas em múltiplos formatos (ABNT, APA, Vancouver, Chicago, MLA, IEEE). Ideal para estudantes e pesquisadores.

![License](https://img.shields.io/github/license/icognita1702/academic-reference-generator)
![Version](https://img.shields.io/github/v/release/icognita1702/academic-reference-generator)
![Chrome Web Store](https://img.shields.io/chrome-web-store/v/[ID_DA_EXTENSAO])

## 🎯 Recursos

- **Extração Automática**: Coleta metadados (título, autores, ano, URL, domínio e DOI) diretamente da página
- **Múltiplos Estilos**: ABNT, APA, Vancouver, Chicago, MLA, IEEE
- **Entrada Manual**: Complementa ou corrige metadados automaticamente coletados
- **Histórico Local**: Armazena até 20 referências geradas recentemente
- **Interface Moderna**: UI responsiva e intuitiva com tema gradiente
- **Exportação**: Copiar para área de transferência ou baixar como arquivo de texto

## 📸 Screenshots

*[Screenshots serão adicionadas após a publicação]*

## 🚀 Como Instalar

### Instalação Local (Desenvolvedor)

1. **Clone o repositório**
   ```bash
   git clone https://github.com/icognita1702/academic-reference-generator.git
   cd academic-reference-generator
   ```

2. **Carregue no Chrome**
   - Acesse `chrome://extensions`
   - Ative o "Modo do desenvolvedor"
   - Clique em "Carregar sem compactação"
   - Selecione a pasta do projeto

### Instalação via Chrome Web Store

*[Link será adicionado após aprovação]*

## 📁 Estrutura do Projeto

```
.
├── manifest.json           # Configuração da extensão
├── popup.html              # Interface principal
├── background.js           # Service worker
├── content.js              # Coleta de metadados
├── styles/
│   └── popup.css          # Estilos da interface
├── scripts/
│   └── popup.js           # Lógica do popup
├── icons/
│   ├── icon16.png         # Ícone 16x16
│   ├── icon48.png         # Ícone 48x48
│   └── icon128.png        # Ícone 128x128
└── README.md
```

## 🎨 Formatos Suportados

| Formato | Área de Aplicação | Exemplo |
|---------|-------------------|----------|
| **ABNT** | Brasil (geral) | SOBRENOME, Nome. Título. Site, 2024. Disponível em: <URL>. Acesso em: dd mmm. aaaa. |
| **APA** | Psicologia, Educação | Sobrenome, N. (2024). Título. Site. URL |
| **Vancouver** | Medicina, Ciências | Sobrenome N. Título. Site. 2024. Disponível em: URL |
| **Chicago** | História, Literatura | Sobrenome, Nome. "Título." Site, 2024. URL |
| **MLA** | Literatura, Humanidades | Sobrenome, Nome. "Título." Site, 2024, URL. |
| **IEEE** | Engenharia, Tecnologia | N. Sobrenome, "Título," Site, 2024. [Online]. Available: URL |

## 🔧 Como Usar

1. **Navegue** para a página que deseja referenciar
2. **Clique** no ícone da extensão na barra do Chrome
3. **Verifique** os metadados coletados automaticamente
4. **Ajuste** manualmente se necessário (botão "Entrada Manual")
5. **Selecione** o formato desejado (ABNT, APA, etc.)
6. **Clique** em "Gerar Referência"
7. **Copie** ou **baixe** a referência pronta

## 📝 Notas sobre Qualidade

- **ABNT**: Varia entre instituições; ajuste conforme norma local
- **Autores**: Heurística tenta múltiplos metadados (citation_author, dc.creator, og:author)
- **DOI**: Quando disponível, facilita validação posterior
- **Datas**: Formato brasileiro para ABNT, internacional para demais

## 🛠️ Desenvolvimento

### Pré-requisitos
- Chrome/Chromium 88+
- Conhecimento básico em JavaScript, HTML, CSS

### Tecnologias Utilizadas
- **Manifest V3** (Chrome Extensions)
- **Chrome Storage API** (histórico local)
- **Chrome Scripting API** (coleta de metadados)
- **Font Awesome** (ícones)
- **Inter Font** (tipografia)

### Contribuindo

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 🗺️ Roadmap

- [ ] **Exportação BibTeX/RIS**: Formatos .bib e .ris para gerenciadores de referência
- [ ] **Tipos de Documento**: Suporte específico para livros, capítulos, teses, artigos
- [ ] **Normalização de Nomes**: Tratamento de acentos, partículas, capitalização
- [ ] **Validação por Estilo**: Verificador de conformidade com cada norma
- [ ] **API Crossref**: Integração para enriquecer metadados via DOI
- [ ] **Internacionalização**: Suporte a pt-BR e en-US
- [ ] **Temas**: Modo claro/escuro
- [ ] **Sincronização**: Backup do histórico na nuvem

## 📄 Licença

Este projeto está licenciado sob a Licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 🤝 Créditos

Desenvolvido por [Filipe Souza](https://github.com/icognita1702)

## 📞 Suporte

- **Issues**: [GitHub Issues](https://github.com/icognita1702/academic-reference-generator/issues)
- **Discussões**: [GitHub Discussions](https://github.com/icognita1702/academic-reference-generator/discussions)
- **Email**: filipesouza0299@gmail.com

---

⭐ Se este projeto te ajudou, considere dar uma estrela no repositório!