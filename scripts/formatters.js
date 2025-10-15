/**
 * Formatters Module
 * Supports ABNT, APA, and generic formats for books, articles, and webpages
 */

class Formatters {
  constructor() {}

  // Helper to format author names
  formatAuthors(authors = [], style = 'APA') {
    if (!authors || authors.length === 0) return '';

    const formatName = (a) => {
      const last = (a.lastName || '').toUpperCase();
      const first = (a.firstName || '').split(/\s+/).filter(Boolean).map(n => n[0].toUpperCase() + '.').join(' ');
      return style === 'ABNT' ? `${last}, ${first}` : `${a.lastName || ''}, ${a.firstName || ''}`;
    };

    if (style === 'ABNT') {
      return authors.map(formatName).join('; ');
    }

    // APA
    if (authors.length === 1) return `${authors[0].lastName || ''}, ${authors[0].firstName || ''}`.trim();
    if (authors.length === 2) return `${authors[0].lastName}, ${authors[0].firstName} & ${authors[1].lastName}, ${authors[1].firstName}`;
    const first19 = authors.slice(0, 19).map(a => `${a.lastName}, ${a.firstName}`);
    return `${first19.join(', ')}, et al.`;
  }

  // APA article
  formatArticleAPA(m) {
    const authors = this.formatAuthors(m.authors, 'APA');
    const year = m.year ? `(${m.year}).` : '(n.d.).';
    const title = m.title ? `${m.title}.` : '';
    const journal = m.journal ? `${m.journal}` : '';
    const volIssue = m.volume ? `${m.volume}${m.issue ? `(${m.issue})` : ''}` : '';
    const pages = m.pages ? `, ${m.pages}` : '';
    const doi = m.doi ? ` https://doi.org/${m.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i,'')}` : (m.url ? ` ${m.url}` : '');
    return [authors + '.', year, title, [journal, volIssue].filter(Boolean).join(', ')+pages+'.', doi].filter(Boolean).join(' ').replace(/\s+\./g, '.');
  }

  // ABNT article
  formatArticleABNT(m) {
    const authors = this.formatAuthors(m.authors, 'ABNT');
    const title = m.title ? `${m.title}.` : '';
    const journal = m.journal ? `${m.journal},` : '';
    const location = m.city ? `${m.city},` : '';
    const volume = m.volume ? `v. ${m.volume},` : '';
    const issue = m.issue ? `n. ${m.issue},` : '';
    const pages = m.pages ? `p. ${m.pages},` : '';
    const year = m.year ? `${m.year}.` : 's.d.';
    const doi = m.doi ? ` DOI: https://doi.org/${m.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i,'')}.` : (m.url ? ` Disponível em: ${m.url}.` : '');
    return [authors + '.', title, journal, location, volume, issue, pages, year, doi].filter(Boolean).join(' ').replace(/,\s+\./g, '.');
  }

  // APA book
  formatBookAPA(m) {
    const authors = this.formatAuthors(m.authors, 'APA');
    const year = m.year ? `(${m.year}).` : '(n.d.).';
    const title = m.title ? `${m.title}.` : '';
    const edition = m.edition ? ` (${m.edition} ed.).` : '';
    const publisher = m.publisher ? `${m.publisher}.` : '';
    const doi = m.doi ? ` https://doi.org/${m.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i,'')}` : '';
    const isbn = (!doi && m.isbn) ? ` ISBN: ${m.isbn}.` : '';
    return [authors + '.', year, title + edition, publisher, doi || isbn].filter(Boolean).join(' ').replace(/\s+\./g, '.');
  }

  // ABNT book
  formatBookABNT(m) {
    const authors = this.formatAuthors(m.authors, 'ABNT');
    const title = m.title ? `${m.title}.` : '';
    const edition = m.edition ? `${m.edition}. ed.` : '';
    const location = m.city ? `${m.city}:` : '';
    const publisher = m.publisher ? `${m.publisher},` : '';
    const year = m.year ? `${m.year}.` : 's.d.';
    const pages = m.pages ? `${m.pages} p.` : '';
    const isbn = m.isbn ? ` ISBN ${m.isbn}.` : '';
    return [authors + '.', title, edition, location, publisher, year, pages, isbn].filter(Boolean).join(' ').replace(/:\s+\./g, '.');
  }

  // APA webpage
  formatWebpageAPA(m) {
    const authors = this.formatAuthors(m.authors, 'APA');
    const year = m.year ? `(${m.year}).` : '(n.d.).';
    const title = m.title ? `${m.title}.` : '';
    const site = m.site ? `${m.site}.` : '';
    const access = m.accessDate ? ` Accessed ${m.accessDate}.` : '';
    const url = m.url ? ` ${m.url}` : '';
    return [authors ? authors + '.' : '', year, title, site, access, url].filter(Boolean).join(' ').replace(/\s+\./g, '.');
  }

  // ABNT webpage
  formatWebpageABNT(m) {
    const authors = this.formatAuthors(m.authors, 'ABNT');
    const title = m.title ? `${m.title}.` : '';
    const site = m.site ? `${m.site},` : '';
    const year = m.year ? `${m.year}.` : 's.d.';
    const url = m.url ? ` Disponível em: ${m.url}.` : '';
    const access = m.accessDate ? ` Acesso em: ${m.accessDate}.` : '';
    return [authors ? authors + '.' : '', title, site, year, url, access].filter(Boolean).join(' ').replace(/\s+\./g, '.');
  }

  format(metadata, style = 'APA') {
    const m = metadata || {};
    const t = (m.type || '').toLowerCase();
    if (style === 'ABNT') {
      if (t === 'book') return this.formatBookABNT(m);
      if (t === 'article') return this.formatArticleABNT(m);
      return this.formatWebpageABNT(m);
    }
    // APA default
    if (t === 'book') return this.formatBookAPA(m);
    if (t === 'article') return this.formatArticleAPA(m);
    return this.formatWebpageAPA(m);
  }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Formatters;
}
