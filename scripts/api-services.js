/**
 * API Services Module
 * Provides integration with external APIs for metadata enrichment
 * Supports: CrossRef, Google Books, Open Library, Unpaywall, ISBNdb
 */

class APIServices {
  constructor() {
    this.crossrefBaseUrl = 'https://api.crossref.org/works';
    this.googleBooksBaseUrl = 'https://www.googleapis.com/books/v1/volumes';
    this.openLibraryBaseUrl = 'https://openlibrary.org';
    this.unpaywallBaseUrl = 'https://api.unpaywall.org/v2';
    this.email = 'academic@reference.generator'; // Required for Unpaywall
  }

  /**
   * Fetch metadata from CrossRef by DOI
   * @param {string} doi - Digital Object Identifier
   * @returns {Promise<Object>} - Article metadata
   */
  async fetchCrossRef(doi) {
    try {
      const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
      const url = `${this.crossrefBaseUrl}/${encodeURIComponent(cleanDoi)}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('CrossRef API error');
      const data = await response.json();
      return this.parseCrossRefData(data.message);
    } catch (error) {
      console.error('CrossRef fetch error:', error);
      return null;
    }
  }

  /**
   * Search CrossRef by title
   * @param {string} title - Article title
   * @returns {Promise<Object>} - Article metadata
   */
  async searchCrossRef(title) {
    try {
      const url = `${this.crossrefBaseUrl}?query.title=${encodeURIComponent(title)}&rows=1`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('CrossRef search error');
      const data = await response.json();
      if (data.message.items && data.message.items.length > 0) {
        return this.parseCrossRefData(data.message.items[0]);
      }
      return null;
    } catch (error) {
      console.error('CrossRef search error:', error);
      return null;
    }
  }

  /**
   * Parse CrossRef response into normalized metadata
   */
  parseCrossRefData(data) {
    const authors = data.author ? data.author.map(a => ({
      firstName: a.given || '',
      lastName: a.family || ''
    })) : [];

    return {
      type: 'article',
      title: data.title?.[0] || '',
      authors: authors,
      year: data.published?.['date-parts']?.[0]?.[0] || data.created?.['date-parts']?.[0]?.[0] || '',
      journal: data['container-title']?.[0] || '',
      volume: data.volume || '',
      issue: data.issue || '',
      pages: data.page || '',
      doi: data.DOI || '',
      url: data.URL || '',
      publisher: data.publisher || '',
      issn: data.ISSN?.[0] || ''
    };
  }

  /**
   * Fetch book metadata from Google Books by ISBN
   * @param {string} isbn - ISBN-10 or ISBN-13
   * @returns {Promise<Object>} - Book metadata
   */
  async fetchGoogleBooks(isbn) {
    try {
      const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
      const url = `${this.googleBooksBaseUrl}?q=isbn:${cleanIsbn}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Google Books API error');
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return this.parseGoogleBooksData(data.items[0].volumeInfo);
      }
      return null;
    } catch (error) {
      console.error('Google Books fetch error:', error);
      return null;
    }
  }

  /**
   * Search Google Books by title
   * @param {string} title - Book title
   * @returns {Promise<Object>} - Book metadata
   */
  async searchGoogleBooksByTitle(title) {
    try {
      const url = `${this.googleBooksBaseUrl}?q=intitle:${encodeURIComponent(title)}&maxResults=1`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Google Books search error');
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        return this.parseGoogleBooksData(data.items[0].volumeInfo);
      }
      return null;
    } catch (error) {
      console.error('Google Books search error:', error);
      return null;
    }
  }

  /**
   * Parse Google Books response into normalized metadata
   */
  parseGoogleBooksData(data) {
    const authors = data.authors ? data.authors.map(name => {
      const parts = name.trim().split(' ');
      return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts[parts.length - 1]
      };
    }) : [];

    return {
      type: 'book',
      title: data.title || '',
      authors: authors,
      year: data.publishedDate ? data.publishedDate.substring(0, 4) : '',
      publisher: data.publisher || '',
      city: '',
      edition: '',
      isbn: data.industryIdentifiers?.find(id => id.type.includes('ISBN'))?.identifier || '',
      pages: data.pageCount || ''
    };
  }

  /**
   * Fetch book metadata from Open Library by ISBN
   * @param {string} isbn - ISBN-10 or ISBN-13
   * @returns {Promise<Object>} - Book metadata
   */
  async fetchOpenLibrary(isbn) {
    try {
      const cleanIsbn = isbn.replace(/[^0-9X]/gi, '');
      const url = `${this.openLibraryBaseUrl}/api/books?bibkeys=ISBN:${cleanIsbn}&format=json&jscmd=data`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Open Library API error');
      const data = await response.json();
      const key = `ISBN:${cleanIsbn}`;
      if (data[key]) {
        return this.parseOpenLibraryData(data[key]);
      }
      return null;
    } catch (error) {
      console.error('Open Library fetch error:', error);
      return null;
    }
  }

  /**
   * Parse Open Library response into normalized metadata
   */
  parseOpenLibraryData(data) {
    const authors = data.authors ? data.authors.map(a => {
      const name = a.name.trim();
      const parts = name.split(' ');
      return {
        firstName: parts.slice(0, -1).join(' '),
        lastName: parts[parts.length - 1]
      };
    }) : [];

    return {
      type: 'book',
      title: data.title || '',
      authors: authors,
      year: data.publish_date ? data.publish_date.match(/\d{4}/)?.[0] || '' : '',
      publisher: data.publishers?.[0]?.name || '',
      city: data.publish_places?.[0]?.name || '',
      edition: '',
      isbn: data.identifiers?.isbn_13?.[0] || data.identifiers?.isbn_10?.[0] || '',
      pages: data.number_of_pages || ''
    };
  }

  /**
   * Fetch article metadata from Unpaywall by DOI
   * @param {string} doi - Digital Object Identifier
   * @returns {Promise<Object>} - Article metadata with OA status
   */
  async fetchUnpaywall(doi) {
    try {
      const cleanDoi = doi.replace(/^https?:\/\/(dx\.)?doi\.org\//i, '');
      const url = `${this.unpaywallBaseUrl}/${encodeURIComponent(cleanDoi)}?email=${this.email}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error('Unpaywall API error');
      const data = await response.json();
      return this.parseUnpaywallData(data);
    } catch (error) {
      console.error('Unpaywall fetch error:', error);
      return null;
    }
  }

  /**
   * Parse Unpaywall response into normalized metadata
   */
  parseUnpaywallData(data) {
    const authors = data.z_authors ? data.z_authors.map(a => ({
      firstName: a.given || '',
      lastName: a.family || ''
    })) : [];

    return {
      type: 'article',
      title: data.title || '',
      authors: authors,
      year: data.year || '',
      journal: data.journal_name || '',
      volume: '',
      issue: '',
      pages: '',
      doi: data.doi || '',
      url: data.best_oa_location?.url || data.doi_url || '',
      publisher: data.publisher || '',
      isOpenAccess: data.is_oa || false
    };
  }

  /**
   * Master method to fetch metadata from multiple sources
   * Tries multiple APIs and merges results for best data quality
   * @param {Object} query - Query object with type and identifier
   * @returns {Promise<Object>} - Enriched metadata
   */
  async fetchMetadata(query) {
    const { type, identifier, title } = query;
    let results = [];

    // For DOI-based queries (articles)
    if (type === 'doi' || (identifier && identifier.match(/10\.\d{4,}/))) {
      const crossRefResult = await this.fetchCrossRef(identifier);
      if (crossRefResult) results.push(crossRefResult);
      
      const unpaywallResult = await this.fetchUnpaywall(identifier);
      if (unpaywallResult) results.push(unpaywallResult);
    }
    
    // For ISBN-based queries (books)
    else if (type === 'isbn' || (identifier && identifier.match(/\d{9}[\dX]/i))) {
      const googleBooksResult = await this.fetchGoogleBooks(identifier);
      if (googleBooksResult) results.push(googleBooksResult);
      
      const openLibraryResult = await this.fetchOpenLibrary(identifier);
      if (openLibraryResult) results.push(openLibraryResult);
    }
    
    // For title-based queries
    else if (title) {
      // Try article search first
      const crossRefResult = await this.searchCrossRef(title);
      if (crossRefResult) results.push(crossRefResult);
      
      // Then try book search
      const googleBooksResult = await this.searchGoogleBooksByTitle(title);
      if (googleBooksResult) results.push(googleBooksResult);
    }

    // Merge results, preferring more complete data
    if (results.length > 0) {
      return this.mergeMetadata(results);
    }

    return null;
  }

  /**
   * Merge multiple metadata objects, preferring more complete fields
   */
  mergeMetadata(metadataArray) {
    if (metadataArray.length === 1) return metadataArray[0];

    const merged = { ...metadataArray[0] };
    
    for (let i = 1; i < metadataArray.length; i++) {
      const current = metadataArray[i];
      for (const key in current) {
        // Prefer non-empty values
        if (current[key] && (!merged[key] || merged[key] === '')) {
          merged[key] = current[key];
        }
        // For arrays (like authors), prefer longer arrays
        else if (Array.isArray(current[key]) && current[key].length > (merged[key]?.length || 0)) {
          merged[key] = current[key];
        }
      }
    }

    return merged;
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = APIServices;
}
