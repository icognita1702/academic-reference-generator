/**
 * Metadata Enrichment Module
 * Provides heuristic extraction and enrichment of metadata from various sources
 * Supports: PDF metadata extraction, HTML metadata parsing, DOI/ISBN detection
 */

class MetadataEnricher {
  constructor() {
    this.apiServices = new APIServices();
  }

  /**
   * Extract metadata from a webpage
   * @param {string} url - Webpage URL
   * @param {Document} doc - Document object (optional, for content script)
   * @returns {Promise<Object>} - Extracted metadata
   */
  async extractFromWebpage(url, doc = document) {
    const metadata = {
      type: 'webpage',
      url: url,
      title: '',
      authors: [],
      year: '',
      site: '',
      accessDate: new Date().toISOString().split('T')[0]
    };

    // Try Open Graph tags
    const ogTitle = doc.querySelector('meta[property="og:title"]');
    if (ogTitle) metadata.title = ogTitle.content;

    // Try Twitter card tags
    const twitterTitle = doc.querySelector('meta[name="twitter:title"]');
    if (!metadata.title && twitterTitle) metadata.title = twitterTitle.content;

    // Try standard title tag
    if (!metadata.title) {
      metadata.title = doc.title;
    }

    // Extract site name
    const ogSite = doc.querySelector('meta[property="og:site_name"]');
    if (ogSite) {
      metadata.site = ogSite.content;
    } else {
      try {
        const urlObj = new URL(url);
        metadata.site = urlObj.hostname.replace(/^www\./, '');
      } catch (e) {
        metadata.site = '';
      }
    }

    // Try to extract authors from meta tags
    const authorMeta = doc.querySelector('meta[name="author"]') || 
                       doc.querySelector('meta[property="article:author"]');
    if (authorMeta) {
      const authorName = authorMeta.content.trim();
      if (authorName) {
        const parts = authorName.split(' ');
        metadata.authors = [{
          firstName: parts.slice(0, -1).join(' '),
          lastName: parts[parts.length - 1]
        }];
      }
    }

    // Try to extract publication date
    const dateMeta = doc.querySelector('meta[property="article:published_time"]') ||
                     doc.querySelector('meta[name="publication_date"]') ||
                     doc.querySelector('meta[name="date"]');
    if (dateMeta) {
      const dateStr = dateMeta.content;
      const yearMatch = dateStr.match(/\d{4}/);
      if (yearMatch) metadata.year = yearMatch[0];
    }

    // Check for DOI in the page
    const doi = this.extractDOI(url, doc);
    if (doi) {
      // Try to enrich with CrossRef data
      const enriched = await this.apiServices.fetchCrossRef(doi);
      if (enriched) {
        return { ...metadata, ...enriched, url: url };
      }
    }

    return metadata;
  }

  /**
   * Extract DOI from URL or document
   * @param {string} url - URL to check
   * @param {Document} doc - Document to search
   * @returns {string|null} - DOI if found
   */
  extractDOI(url, doc = document) {
    // Check URL for DOI
    const urlDoiMatch = url.match(/10\.\d{4,}[\/\.]\S+/);
    if (urlDoiMatch) return urlDoiMatch[0];

    // Check document for DOI meta tag
    const doiMeta = doc.querySelector('meta[name="citation_doi"]') ||
                    doc.querySelector('meta[name="dc.identifier"][content*="10."]');
    if (doiMeta) {
      const doiMatch = doiMeta.content.match(/10\.\d{4,}[\/\.]\S+/);
      if (doiMatch) return doiMatch[0];
    }

    // Search in page text
    const bodyText = doc.body ? doc.body.innerText : '';
    const textDoiMatch = bodyText.match(/doi:\s*(10\.\d{4,}[\/\.]\S+)/i);
    if (textDoiMatch) return textDoiMatch[1];

    return null;
  }

  /**
   * Extract ISBN from text or URL
   * @param {string} text - Text to search
   * @returns {string|null} - ISBN if found
   */
  extractISBN(text) {
    // ISBN-13: 978-X-XXXX-XXXX-X or 9781234567890
    const isbn13Match = text.match(/(?:ISBN(?:-13)?:?\s*)?(?:97[89][-\s]?(?:\d[-\s]?){9}\d)/i);
    if (isbn13Match) {
      return isbn13Match[0].replace(/[^0-9X]/gi, '');
    }

    // ISBN-10: X-XXXX-XXXX-X or 1234567890
    const isbn10Match = text.match(/(?:ISBN(?:-10)?:?\s*)?(?:\d[-\s]?){9}[\dX]/i);
    if (isbn10Match) {
      return isbn10Match[0].replace(/[^0-9X]/gi, '');
    }

    return null;
  }

  /**
   * Extract metadata from PDF (using PDF.js or similar)
   * @param {string} url - PDF URL
   * @param {Object} pdfMetadata - PDF metadata object (if available)
   * @returns {Promise<Object>} - Extracted metadata
   */
  async extractFromPDF(url, pdfMetadata = null) {
    const metadata = {
      type: 'article', // Default to article, can be changed
      url: url,
      title: '',
      authors: [],
      year: '',
      journal: '',
      volume: '',
      issue: '',
      pages: '',
      doi: ''
    };

    if (pdfMetadata) {
      // Extract from PDF metadata
      if (pdfMetadata.Title) metadata.title = pdfMetadata.Title;
      if (pdfMetadata.Author) {
        const authorNames = pdfMetadata.Author.split(/[,;]/);
        metadata.authors = authorNames.map(name => {
          const parts = name.trim().split(' ');
          return {
            firstName: parts.slice(0, -1).join(' '),
            lastName: parts[parts.length - 1]
          };
        });
      }
      if (pdfMetadata.CreationDate) {
        const yearMatch = pdfMetadata.CreationDate.match(/\d{4}/);
        if (yearMatch) metadata.year = yearMatch[0];
      }
      if (pdfMetadata.Subject) {
        // Try to extract DOI from subject
        const doi = this.extractDOI(pdfMetadata.Subject, { body: { innerText: pdfMetadata.Subject } });
        if (doi) metadata.doi = doi;
      }
    }

    // Try to extract DOI from URL
    const urlDoi = this.extractDOI(url, { body: { innerText: '' } });
    if (urlDoi) metadata.doi = urlDoi;

    // If we have a DOI, enrich with API data
    if (metadata.doi) {
      const enriched = await this.apiServices.fetchCrossRef(metadata.doi);
      if (enriched) {
        return { ...metadata, ...enriched, url: url };
      }
    }

    return metadata;
  }

  /**
   * Enrich metadata using title search across multiple APIs
   * @param {Object} metadata - Partial metadata with at least a title
   * @returns {Promise<Object>} - Enriched metadata
   */
  async enrichByTitle(metadata) {
    if (!metadata.title) return metadata;

    // Try CrossRef first for articles
    const crossRefResult = await this.apiServices.searchCrossRef(metadata.title);
    if (crossRefResult && crossRefResult.doi) {
      return { ...metadata, ...crossRefResult };
    }

    // Try Google Books for books
    const googleBooksResult = await this.apiServices.searchGoogleBooksByTitle(metadata.title);
    if (googleBooksResult && googleBooksResult.isbn) {
      return { ...metadata, ...googleBooksResult };
    }

    return metadata;
  }

  /**
   * Enrich metadata using ISBN
   * @param {string} isbn - ISBN to search
   * @returns {Promise<Object>} - Book metadata
   */
  async enrichByISBN(isbn) {
    const metadata = await this.apiServices.fetchMetadata({
      type: 'isbn',
      identifier: isbn
    });

    return metadata || {
      type: 'book',
      isbn: isbn,
      title: '',
      authors: [],
      year: '',
      publisher: '',
      city: '',
      edition: ''
    };
  }

  /**
   * Enrich metadata using DOI
   * @param {string} doi - DOI to search
   * @returns {Promise<Object>} - Article metadata
   */
  async enrichByDOI(doi) {
    const metadata = await this.apiServices.fetchMetadata({
      type: 'doi',
      identifier: doi
    });

    return metadata || {
      type: 'article',
      doi: doi,
      title: '',
      authors: [],
      year: '',
      journal: '',
      volume: '',
      issue: '',
      pages: ''
    };
  }

  /**
   * Smart metadata extraction - detects type and enriches accordingly
   * @param {Object} input - Input object with url, text, or identifier
   * @returns {Promise<Object>} - Enriched metadata
   */
  async smartExtract(input) {
    const { url, text, identifier, type } = input;

    // Check for explicit type
    if (type === 'doi' && identifier) {
      return await this.enrichByDOI(identifier);
    }
    if (type === 'isbn' && identifier) {
      return await this.enrichByISBN(identifier);
    }

    // Auto-detect from text or URL
    const searchText = text || url || identifier || '';

    // Try to find DOI
    const doi = this.extractDOI(searchText, { body: { innerText: searchText } });
    if (doi) {
      return await this.enrichByDOI(doi);
    }

    // Try to find ISBN
    const isbn = this.extractISBN(searchText);
    if (isbn) {
      return await this.enrichByISBN(isbn);
    }

    // If it's a URL, extract from webpage
    if (url && url.startsWith('http')) {
      // Check if it's a PDF
      if (url.toLowerCase().endsWith('.pdf')) {
        return await this.extractFromPDF(url);
      }
      // Otherwise treat as webpage (would need document object from content script)
      return {
        type: 'webpage',
        url: url,
        title: '',
        authors: [],
        year: '',
        accessDate: new Date().toISOString().split('T')[0]
      };
    }

    // Last resort: try title search if we have text
    if (searchText) {
      return await this.enrichByTitle({ title: searchText });
    }

    return null;
  }

  /**
   * Validate and complete metadata
   * Ensures all required fields are present and properly formatted
   * @param {Object} metadata - Metadata to validate
   * @returns {Object} - Validated and completed metadata
   */
  validateAndComplete(metadata) {
    if (!metadata) return null;

    // Ensure authors array is properly formatted
    if (metadata.authors && metadata.authors.length > 0) {
      metadata.authors = metadata.authors.map(author => {
        if (typeof author === 'string') {
          const parts = author.trim().split(' ');
          return {
            firstName: parts.slice(0, -1).join(' '),
            lastName: parts[parts.length - 1]
          };
        }
        return author;
      });
    }

    // Clean up year (extract 4-digit year)
    if (metadata.year && typeof metadata.year === 'string') {
      const yearMatch = metadata.year.match(/\d{4}/);
      if (yearMatch) metadata.year = yearMatch[0];
    }

    // Ensure type is set
    if (!metadata.type) {
      if (metadata.isbn) metadata.type = 'book';
      else if (metadata.journal || metadata.doi) metadata.type = 'article';
      else if (metadata.url) metadata.type = 'webpage';
      else metadata.type = 'misc';
    }

    // Clean up DOI (remove URL prefix)
    if (metadata.doi) {
      metadata.doi = metadata.doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
    }

    return metadata;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MetadataEnricher;
}
