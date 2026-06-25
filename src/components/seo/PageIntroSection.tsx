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
  className = '',
}: PageIntroSectionProps) => {
  if (isLoading) {
    return (
      <section className={`border-y border-border/60 bg-muted/35 py-12 md:py-14 ${className}`}>
        <div className="container max-w-5xl px-4 md:px-6">
          <div className="marketplace-panel p-8 md:p-10">
            <div className="h-3 w-28 rounded-full bg-muted animate-pulse" />
            <div className="mt-4 h-10 w-2/3 rounded-2xl bg-muted animate-pulse" />
            <div className="mt-6 space-y-3">
              <div className="h-4 w-full rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-5/6 rounded-full bg-muted animate-pulse" />
              <div className="h-4 w-4/5 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!title && !content) {
    return null;
  }

  return (
    <section className={`border-y border-border/60 bg-muted/35 py-12 md:py-14 ${className}`}>
      <div className="container max-w-5xl px-4 md:px-6">
        <div className="marketplace-panel p-8 md:p-10 lg:p-12">
          <div className="inline-flex items-center rounded-full border border-primary/15 bg-primary/6 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
            Marketplace Overview
          </div>

          {title && (
            <h1 className="mt-5 font-display text-3xl font-black tracking-tight text-foreground md:text-4xl lg:text-5xl">
              {title}
            </h1>
          )}

          {content && (
            <div className="hero-intro mt-5 max-w-3xl text-base leading-8 text-muted-foreground md:text-lg">
              <p>{content}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default PageIntroSection;
