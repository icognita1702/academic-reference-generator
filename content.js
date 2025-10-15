// Injeta utilitários na página para enriquecer metadados (ex: DOI)
(() => {
  const extractors = {
    doi() {
      const meta = document.querySelector('meta[name="citation_doi"], meta[name="dc.identifier"], meta[name="dc.Identifier"], meta[name="DOI"]');
      if (meta?.content) return meta.content.trim();
      const text = document.body?.innerText || '';
      const m = text.match(/10\.\d{4,9}\/[-._;()/:A-Z0-9]+/i);
      return m ? m[0] : '';
    },
    authors() {
      const metas = Array.from(document.querySelectorAll('meta[name^="citation_author"], meta[name="author"], meta[property="article:author"]'));
      const list = metas.map(m => m.content).filter(Boolean);
      return list.join('; ');
    },
    title() {
      const m = document.querySelector('meta[name="citation_title"], meta[property="og:title"], meta[name="title"]');
      return (m?.content || document.title || '').trim();
    },
    year() {
      const m = document.querySelector('meta[name="citation_publication_date"], meta[name="dc.date"], meta[name="DC.Date"], meta[property="article:published_time"]');
      const raw = m?.content || '';
      const y = raw.match(/\d{4}/);
      return y ? y[0] : new Date().getFullYear().toString();
    },
    site() {
      return location.hostname.replace('www.', '');
    }
  };

  window.__ARG_META__ = {
    getAll() {
      return {
        doi: extractors.doi(),
        authors: extractors.authors(),
        title: extractors.title(),
        year: extractors.year(),
        site: extractors.site(),
        url: location.href
      };
    }
  };
})();
