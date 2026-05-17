import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useAppContext, type PartyMaster } from '../store/AppContext';
import { Search, Plus, Sparkles, Building2 } from 'lucide-react';
import { cn } from './Sidebar';

interface PartyAutocompleteProps {
  value: string;
  onChange: (val: string) => void;
  onSelectParty: (party: PartyMaster) => void;
  placeholder?: string;
  className?: string;
}

export const PartyAutocomplete: React.FC<PartyAutocompleteProps> = ({
  value,
  onChange,
  onSelectParty,
  placeholder = 'Type party name...',
  className = ''
}) => {
  const { parties, addParty } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync state with prop value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Filter parties based on input
  const filteredParties = useMemo(() => {
    const query = inputValue.trim().toUpperCase();
    if (!query) return parties;
    return parties.filter(p => 
      p.partyName.toUpperCase().includes(query) || 
      p.contactPerson.toUpperCase().includes(query) || 
      p.mobileNumber.includes(query)
    );
  }, [parties, inputValue]);

  // Is the typed value exact match?
  const exactMatchExists = useMemo(() => {
    const query = inputValue.trim().toUpperCase();
    return parties.some(p => p.partyName.toUpperCase() === query);
  }, [parties, inputValue]);

  // Show "Create New" option?
  const showCreateOption = useMemo(() => {
    return inputValue.trim().length > 0 && !exactMatchExists;
  }, [inputValue, exactMatchExists]);

  // Combine items to list: [Parties..., (Optional Create Option)]
  const dropdownItems = useMemo(() => {
    const items: Array<{ type: 'party'; data: PartyMaster } | { type: 'create'; label: string }> = filteredParties.map(p => ({
      type: 'party' as const,
      data: p
    }));
    
    if (showCreateOption) {
      items.push({
        type: 'create' as const,
        label: `+ Create "${inputValue.toUpperCase()}" as Party`
      });
    }
    
    return items;
  }, [filteredParties, showCreateOption, inputValue]);

  // Reset highlighted index when items change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [dropdownItems]);

  // Handle clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectItem = async (index: number) => {
    const item = dropdownItems[index];
    if (!item) return;

    if (item.type === 'party') {
      onSelectParty(item.data);
      setInputValue(item.data.partyName);
      setIsOpen(false);
    } else if (item.type === 'create') {
      // Create new party on-the-fly
      const newName = inputValue.trim().toUpperCase();
      const newParty = await addParty({
        partyName: newName,
        contactPerson: '',
        mobileNumber: '',
        location: '',
        deliveryAddress: '',
        paymentTerms: ''
      });
      onSelectParty(newParty);
      setInputValue(newParty.partyName);
      setIsOpen(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < dropdownItems.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : dropdownItems.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (dropdownItems[highlightedIndex]) {
          selectItem(highlightedIndex);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        break;
      case 'Tab':
        setIsOpen(false);
        break;
      default:
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => {
            const val = e.target.value;
            setInputValue(val);
            onChange(val);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={cn(
            "w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition pl-9",
            className
          )}
        />
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
      </div>

      {isOpen && dropdownItems.length > 0 && (
        <div className="absolute left-0 right-0 mt-1.5 max-h-60 overflow-y-auto z-50 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl divide-y divide-slate-100 dark:divide-slate-900 transition-all animate-in fade-in slide-in-from-top-1.5 duration-100">
          <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" />
              List of Ledgers (Tally Prime)
            </span>
            <span className="text-[9px] font-medium text-slate-400 dark:text-slate-650 tracking-wider">
              Arrows/Enter to select
            </span>
          </div>

          <div className="p-1 space-y-0.5">
            {dropdownItems.map((item, idx) => {
              const isHighlighted = idx === highlightedIndex;
              
              if (item.type === 'party') {
                return (
                  <button
                    key={item.type + '-' + item.data.id}
                    onClick={() => selectItem(idx)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full text-left px-3.5 py-2.5 rounded-lg text-xs font-semibold flex flex-col gap-0.5 transition-all outline-none",
                      isHighlighted 
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100 dark:shadow-none" 
                        : "text-slate-700 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900"
                    )}
                  >
                    <span className="font-bold flex items-center justify-between">
                      {item.data.partyName}
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-md",
                        isHighlighted 
                          ? "bg-blue-500 text-white" 
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450"
                      )}>
                        {item.data.location}
                      </span>
                    </span>
                    {(item.data.contactPerson || item.data.mobileNumber) && (
                      <span className={cn(
                        "text-[10px] font-medium truncate",
                        isHighlighted ? "text-blue-100" : "text-slate-400 dark:text-slate-550"
                      )}>
                        {item.data.contactPerson && `${item.data.contactPerson} • `}{item.data.mobileNumber}
                      </span>
                    )}
                  </button>
                );
              } else {
                return (
                  <button
                    key="create-new"
                    onClick={() => selectItem(idx)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={cn(
                      "w-full text-left px-3.5 py-3 rounded-lg text-xs font-bold flex items-center justify-between transition-all outline-none",
                      isHighlighted 
                        ? "bg-emerald-600 text-white shadow-md shadow-emerald-100 dark:shadow-none" 
                        : "text-emerald-600 dark:text-emerald-450 bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      {item.label}
                    </span>
                    <Sparkles className={cn(
                      "w-3.5 h-3.5",
                      isHighlighted ? "text-white" : "text-emerald-400"
                    )} />
                  </button>
                );
              }
            })}
          </div>
        </div>
      )}
    </div>
  );
};
