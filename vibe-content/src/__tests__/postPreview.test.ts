import test from 'node:test';
import assert from 'node:assert/strict';
import { buildPostPreview } from '../utils/postPreview.js';

test('buildPostPreview returns title, category, tags and a 20-word preview', () => {
  const preview = buildPostPreview({
    title: 'AI đang đổi cách chúng ta làm việc',
    content: 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two',
    category: 'Công nghệ',
    tags: ['ai', 'productivity'],
  });

  assert.equal(preview.title, 'AI đang đổi cách chúng ta làm việc');
  assert.equal(preview.category, 'Công nghệ');
  assert.deepEqual(preview.tags, ['ai', 'productivity']);
  assert.equal(preview.contentPreview, 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty...');
});
