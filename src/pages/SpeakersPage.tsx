import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Layout from '../components/layout/Layout';
import PageHeader from '../components/ui/PageHeader';
import SpeakersGrid, { Speaker } from '../components/speakers/SpeakersGrid';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

type SortOption = 'name-asc' | 'name-desc' | 'field-asc' | 'field-desc';

const SpeakersPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('name-asc');
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpeakers = async () => {
      try {
        let query = supabase
          .from('speakers')
          .select('*')
          .eq('active', true);

        // Apply sorting
        switch (sortBy) {
          case 'name-asc':
            query = query.order('name', { ascending: true });
            break;
          case 'name-desc':
            query = query.order('name', { ascending: false });
            break;
          case 'field-asc':
            query = query.order('field_of_expertise', { ascending: true });
            break;
          case 'field-desc':
            query = query.order('field_of_expertise', { ascending: false });
            break;
        }

        const { data, error } = await query;

        if (error) throw error;

        setSpeakers(data || []);
      } catch (err) {
        console.error('Error fetching speakers:', err);
        setError('Failed to load speakers');
      } finally {
        setLoading(false);
      }
    };

    fetchSpeakers();
  }, [sortBy]);

  if (loading) {
    return (
      <Layout>
        <PageHeader title="Наши спикеры" />
        <div className="section bg-gray-50 dark:bg-dark-800">
          <div className="container text-center py-12">
            Loading...
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <PageHeader title="Наши спикеры" />
        <div className="section bg-gray-50 dark:bg-dark-800">
          <div className="container text-center py-12 text-red-600">
            {error}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <PageHeader 
        title="Наши спикеры" 
        subtitle="Ведущие учёные и эксперты в своих областях"
      />
      
      <main className="section bg-gray-50 dark:bg-dark-800">
        <div className="container">
          {/* Search and Sort */}
          <div className="mb-8 flex flex-col md:flex-row gap-6 justify-between">
            <div className="relative">
              <input 
                type="text" 
                placeholder="Поиск по имени или специализации..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-80 px-4 py-2 pl-10 border border-dark-300 dark:border-dark-700 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-800"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-dark-400" />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="px-4 py-2 border border-dark-300 dark:border-dark-700 rounded-md bg-white dark:bg-dark-800"
            >
              <option value="name-asc">По имени (А-Я)</option>
              <option value="name-desc">По имени (Я-А)</option>
              <option value="field-asc">По специализации (А-Я)</option>
              <option value="field-desc">По специализации (Я-А)</option>
            </select>
          </div>

          {/* Speakers grid */}
          <SpeakersGrid 
            speakers={speakers}
            searchQuery={searchQuery}
          />
        </div>
      </main>
    </Layout>
  );
};

export default SpeakersPage;