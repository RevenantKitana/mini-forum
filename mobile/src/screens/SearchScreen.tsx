import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Search as SearchIcon, X, Tag as TagIcon, Layers } from 'lucide-react-native';
import { Post, Category, Tag } from '../types';
import { colors } from '../theme/colors';
import { searchService } from '../api/services';
import { PostCard } from '../components/PostCard';

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      setPosts([]);
      setCategories([]);
      setTags([]);
      setHasSearched(false);
      return;
    }

    try {
      setLoading(true);
      setHasSearched(true);
      const res = await searchService.search(text.trim());
      if (res.success && res.data) {
        if (Array.isArray(res.data)) {
          setPosts(res.data);
        } else {
          setPosts((res.data as any).posts || []);
          setCategories((res.data as any).categories || []);
          setTags((res.data as any).tags || []);
        }
      }
    } catch (err) {
      console.log('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Search Bar Header */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <SearchIcon size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm bài viết, danh mục, #tag..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch('')}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Loading */}
      {loading && (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}

      {/* Results */}
      {!loading && hasSearched && (
        <FlatList
          data={posts}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            (categories.length > 0 || tags.length > 0) ? (
              <View style={styles.metaResults}>
                {categories.length > 0 && (
                  <View style={styles.metaGroup}>
                    <Text style={styles.metaTitle}>Danh mục:</Text>
                    <View style={styles.metaPills}>
                      {categories.map((c) => (
                        <View key={c.id} style={styles.catPill}>
                          <Layers size={12} color="#A5B4FC" />
                          <Text style={styles.catPillText}>{c.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                {tags.length > 0 && (
                  <View style={styles.metaGroup}>
                    <Text style={styles.metaTitle}>Thẻ tags:</Text>
                    <View style={styles.metaPills}>
                      {tags.map((t) => (
                        <View key={t.id} style={styles.tagPill}>
                          <TagIcon size={12} color={colors.textSecondary} />
                          <Text style={styles.tagPillText}>#{t.name}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            ) : null
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>Không tìm thấy kết quả phù hợp cho "{query}"</Text>
            </View>
          }
          renderItem={({ item }) => (
            <PostCard
              post={item}
              onPress={() => navigation.navigate('PostDetail', { id: item.id })}
            />
          )}
        />
      )}

      {!hasSearched && (
        <View style={styles.initialState}>
          <SearchIcon size={48} color={colors.surfaceHover} />
          <Text style={styles.initialText}>Nhập từ khoá để tìm kiếm bài viết trong diễn đàn</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
  },
  centerContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  metaResults: {
    marginBottom: 16,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  metaGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  metaTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  metaPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(99, 102, 241, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  catPillText: {
    color: '#A5B4FC',
    fontSize: 11,
    fontWeight: '600',
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagPillText: {
    color: colors.textSecondary,
    fontSize: 11,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  initialState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    gap: 12,
  },
  initialText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
});
