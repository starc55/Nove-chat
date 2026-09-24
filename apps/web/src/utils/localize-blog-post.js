export function localizeBlogPost(post, language = "uz") {
  const content = post?.content || {};
  const locale = content[language] || content.uz || content.ru || content.en || {};
  return {
    ...post,
    ...content,
    ...locale,
    category: content.category || "NEWS",
    coverImage: content.coverImage || "",
    publishedAt: content.publishedAt || post?.createdAt,
    sections: locale.sections || [],
    phones: content.phones || [],
  };
}
