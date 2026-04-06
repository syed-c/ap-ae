interface PageIntroSectionProps {
  title: string | null;
  content: string | null;
  isLoading?: boolean;
  className?: string;
}

export const PageIntroSection = ({
  title,
  content,
  isLoading = false,
  className = "",
}: PageIntroSectionProps) => {
  if (isLoading) {
    return (
      <div style={{ padding: '48px 16px', backgroundColor: '#f9fafb', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '896px', margin: '0 auto' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ height: '28px', width: '66%', backgroundColor: '#e5e7eb', borderRadius: '8px', marginBottom: '16px' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ height: '16px', width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              <div style={{ height: '16px', width: '83%', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
              <div style={{ height: '16px', width: '80%', backgroundColor: '#e5e7eb', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const hasContent = !!(title || content);

  if (!hasContent) {
    console.log('[PageIntroSection] No title or content, returning null');
    return null;
  }

  console.log('[PageIntroSection] Rendering with title:', !!title, 'content:', !!content);

  return (
    <div style={{ padding: '48px 16px', backgroundColor: '#ffffff', borderTop: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb' }}>
      <div style={{ maxWidth: '896px', margin: '0 auto' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '32px 40px' }}>
          {title && (
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '20px', lineHeight: '1.3' }}>
              {title}
            </h1>
          )}
          {content && (
            <div style={{ color: '#4b5563', lineHeight: '1.75' }}>
              <p style={{ fontSize: '18px', margin: 0 }}>{content}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PageIntroSection;
