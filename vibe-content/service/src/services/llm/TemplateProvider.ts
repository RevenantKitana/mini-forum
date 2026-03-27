import { ILLMProvider } from './ILLMProvider.js';
import { LLMOutput } from '../../types/index.js';

// Pre-built templates for fallback when all LLM providers are unavailable
const POST_TEMPLATES = [
  { title: 'Một ngày bình thường nhưng suy nghĩ nhiều', content: 'Hôm nay ngồi uống cà phê một mình, tự dưng nhìn lại mấy năm qua mà thấy thay đổi nhiều quá. Không biết mọi người có hay ngồi nghĩ vẩn vơ như mình không? Đôi khi chỉ cần một buổi chiều yên tĩnh là đủ để nhận ra nhiều thứ.' },
  { title: 'Có ai thức khuya như mình không?', content: 'Đêm nào cũng vậy, tầm 1-2h sáng mới chịu ngủ. Không phải vì bận, mà vì ban đêm yên tĩnh, đầu óc mới thực sự hoạt động. Mình hay đọc sách, nghe nhạc, hoặc chỉ đơn giản là ngồi suy nghĩ. Thói quen này tốt hay xấu nhỉ?' },
  { title: 'Học được một bài học đắt giá', content: 'Hồi trước mình hay nói thẳng quá, nghĩ sao nói vậy. Rồi dần dần mất đi vài người bạn thân. Bây giờ mình hiểu rằng thẳng thắn và thô lỗ là hai thứ khác nhau. Nói thật vẫn cần có cách nói cho người ta dễ tiếp nhận.' },
  { title: 'Chia sẻ cách mình quản lý thời gian', content: 'Trước đây mình hay bị overwhelm vì việc quá nhiều. Sau một thời gian thử nghiệm, mình tìm được cách phù hợp: mỗi sáng viết ra 3 việc quan trọng nhất cần làm trong ngày. Chỉ 3 thôi. Hoàn thành 3 cái đó rồi mới làm thêm. Đơn giản nhưng hiệu quả lắm.' },
  { title: 'Sống ở thành phố mệt thật', content: 'Tắc đường, ô nhiễm, ồn ào, chen chúc. Mỗi ngày đi làm về đã hết năng lượng rồi. Có lúc mình tự hỏi sống thế này để làm gì, nhưng rồi nghĩ lại, cơ hội cũng ở đây mà. Mâu thuẫn ghê.' },
  { title: 'Có nên theo đuổi đam mê không?', content: 'Mình thích vẽ từ nhỏ, nhưng gia đình muốn mình học kinh tế. Giờ đi làm được 3 năm, công việc ổn định nhưng không có đam mê gì. Mình đang nghĩ có nên dành thời gian rảnh để học vẽ lại không. Muộn quá không nhỉ?' },
  { title: 'Bạn bè tuổi 30 khác lắm', content: 'Hồi 20 tuổi, bạn bè rủ đi chơi là đi ngay. Giờ 30 rồi, hẹn nhau mãi mới được một buổi. Ai cũng bận, ai cũng có gia đình riêng. Nhưng mà gặp nhau vẫn vui như xưa, chỉ là ít hơn thôi. Quý từng buổi gặp mặt hơn nhiều.' },
  { title: 'Tip nhỏ cho người mới đi làm', content: 'Mình đi làm được vài năm, đúc kết được mấy điều: 1) Đừng ngại hỏi, hỏi ngu vẫn hơn làm sai. 2) Ghi chép lại mọi thứ, đừng tin trí nhớ. 3) Đúng giờ là cách đơn giản nhất để được tin tưởng. 4) Làm tốt việc nhỏ trước khi đòi việc lớn.' },
  { title: 'Mối quan hệ gia đình phức tạp thật', content: 'Yêu thương gia đình nhưng đôi khi cần khoảng cách. Ba mẹ mình hay áp đặt, mình lại thích tự do. Mâu thuẫn hoài, nhưng sau tất cả vẫn là người thân nhất. Học cách giao tiếp với ba mẹ cũng là một kỹ năng quan trọng.' },
  { title: 'Cảm giác khi hoàn thành một mục tiêu', content: 'Hôm nay mình chạy được 5km liên tục lần đầu tiên! Nghe thì đơn giản nhưng với một người từng ghét thể dục như mình thì đây là cả một hành trình. 3 tháng kiên trì, mỗi ngày một chút. Vui lắm mọi người ơi!' },
];

const COMMENT_TEMPLATES = [
  { content: 'Cảm ơn bạn đã chia sẻ! Mình cũng có suy nghĩ tương tự.' },
  { content: 'Hay quá, mình bookmark lại để đọc kỹ hơn.' },
  { content: 'Đồng ý với bạn. Mình cũng từng trải qua chuyện tương tự.' },
  { content: 'Bài viết rất thực tế, cảm ơn bạn nhé!' },
  { content: 'Mình có góc nhìn hơi khác một chút, nhưng cũng tôn trọng ý kiến của bạn.' },
  { content: 'Mình nghĩ mỗi người mỗi hoàn cảnh khác nhau, không có đáp án đúng sai tuyệt đối đâu.' },
  { content: 'Đọc xong mà thấy relate quá! Cảm ơn bạn đã nói hộ lòng mình.' },
  { content: 'Mình từng nghĩ mình là người duy nhất nghĩ vậy, hoá ra không phải.' },
  { content: 'Bài viết ngắn gọn mà sâu sắc. Thích cách bạn diễn đạt.' },
  { content: 'Cái này mình cần suy nghĩ thêm, nhưng quan điểm của bạn rất đáng tham khảo.' },
  { content: 'Chia sẻ thật lòng ghê. Mong bạn sẽ tìm được hướng đi phù hợp!' },
  { content: 'Cảm ơn bạn. Bài này đúng lúc mình đang cần đọc cái gì đó như vậy.' },
  { content: 'Mình thấy vấn đề này phức tạp hơn nhiều so với cái nhìn đầu tiên. Cần xem xét nhiều góc độ.' },
  { content: 'Nếu là mình, mình sẽ thử cách tiếp cận khác. Nhưng mà mỗi người mỗi kiểu 😄' },
  { content: 'Đọc comment mọi người mình thấy học được nhiều. Cảm ơn cả thread!' },
];

export class TemplateProvider implements ILLMProvider {
  id = 'template';

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async generate(prompt: string): Promise<LLMOutput> {
    // Detect action type from prompt content
    if (prompt.includes('shouldVote') || prompt.includes('upvote') || prompt.includes('downvote')) {
      return this.generateVote(prompt);
    }
    if (prompt.includes('comment') || prompt.includes('trả lời') || prompt.includes('bình luận')) {
      return this.generateComment();
    }
    return this.generatePost();
  }

  private generatePost(): LLMOutput {
    const template = POST_TEMPLATES[Math.floor(Math.random() * POST_TEMPLATES.length)];
    const tags = this.pickRandomTags();
    return {
      title: template.title,
      content: template.content,
      tags,
      explain: 'Template fallback — no LLM provider available',
    };
  }

  private generateComment(): LLMOutput {
    const template = COMMENT_TEMPLATES[Math.floor(Math.random() * COMMENT_TEMPLATES.length)];
    return {
      content: template.content,
      explain: 'Template fallback — no LLM provider available',
    };
  }

  private generateVote(_prompt: string): LLMOutput {
    // 70% chance to vote, 80% of votes are upvotes
    const shouldVote = Math.random() < 0.7;
    const voteType = shouldVote ? (Math.random() < 0.8 ? 'up' : 'down') : null;
    return {
      content: '',
      shouldVote,
      voteType,
      reason: 'Template fallback — random vote decision',
    };
  }

  private pickRandomTags(): string[] {
    const allTags = [
      'cuộc sống', 'suy nghĩ', 'cảm xúc', 'công việc', 'gia đình',
      'bạn bè', 'học tập', 'sức khỏe', 'mối quan hệ', 'tâm lý',
    ];
    const count = 1 + Math.floor(Math.random() * 3);
    const shuffled = [...allTags].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }
}
