import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useI18n } from '../context/I18nProvider';

export function AutocompleteSearch({ onNavigate }) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [show, setShow] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const listboxId = 'autocomplete-listbox';

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShow(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      const id = setTimeout(() => setSuggestions([]));
      return () => clearTimeout(id);
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await api.get(`/listings?search=${encodeURIComponent(query)}&limit=6`);
        const items = data.listings || [];
        setSuggestions(items.slice(0, 5));
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  function handleSelect(item) {
    setQuery('');
    setSuggestions([]);
    setShow(false);
    setActiveIndex(-1);
    navigate(`/products/${item.id}`);
    onNavigate?.();
  }

  function handleKeyDown(e) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === 'Enter' && activeIndex >= 0 && suggestions[activeIndex]) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === 'Escape') {
      setShow(false);
      setActiveIndex(-1);
      inputRef.current?.blur();
    }
  }

  return (
    <div className="autocomplete-wrap" ref={wrapperRef} role="combobox" aria-expanded={show && query.length >= 2} aria-haspopup="listbox" aria-owns={listboxId}>
      <input
        ref={inputRef}
        type="search"
        className="autocomplete-input"
        placeholder={t('searchPlaceholder')}
        aria-label={t('searchListingsAria')}
        role="searchbox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeIndex >= 0 ? `autocomplete-item-${activeIndex}` : undefined}
        value={query}
        onChange={(e) => { setQuery(e.target.value); setShow(true); setActiveIndex(-1); }}
        onFocus={() => setShow(true)}
        onKeyDown={handleKeyDown}
      />
      {show && query.length >= 2 && (
        <div className="autocomplete-dropdown" id={listboxId} role="listbox" aria-label={t('searchSuggestionsAria')}>
          {loading ? (
            <div className="autocomplete-loading" role="status" aria-live="polite">{t('searchingText')}</div>
          ) : suggestions.length > 0 ? (
            suggestions.map((item, i) => (
              <button
                key={item.id}
                type="button"
                id={`autocomplete-item-${i}`}
                className={`autocomplete-item${i === activeIndex ? ' active' : ''}`}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setActiveIndex(i)}
              >
                {item.images?.[0] && (
                  <img src={item.images[0]} alt="" className="autocomplete-thumb" />
                )}
                <div className="autocomplete-info">
                  <span className="autocomplete-title">{item.title}</span>
                  <span className="autocomplete-price">€{Number(item.price).toLocaleString()}</span>
                </div>
              </button>
            ))
          ) : (
            <div className="autocomplete-empty" role="status">{t('noResults')}</div>
          )}
        </div>
      )}
    </div>
  );
}