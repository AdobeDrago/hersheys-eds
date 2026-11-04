/**
 * Hero (video) variant, loaded by hero.js for `Hero (video)`.
 *
 * Content model: any rows and cells, read by content type.
 *   Video: a link to an .mp4 (looping, muted background video).
 *   Poster: an optional picture, shown until the video plays or when motion is reduced.
 *   Text: an eyebrow paragraph (before the heading), h1 title, then intro paragraphs.
 * Generated, not authored: the video element, a pause/play button.
 */
export default function decorate(block) {
  const videoLink = [...block.querySelectorAll('a[href]')]
    .find((a) => /\.mp4(\?|#|$)/i.test(a.getAttribute('href')));
  const poster = block.querySelector('picture');
  const heading = block.querySelector('h1, h2');
  const paragraphs = [...block.querySelectorAll('p')]
    .filter((p) => p.textContent.trim() && !p.querySelector('picture') && !p.contains(videoLink));
  const eyebrow = heading
    ? paragraphs.find((p) => heading.compareDocumentPosition(p) & Node.DOCUMENT_POSITION_PRECEDING)
    : null;

  const media = document.createElement('div');
  media.className = 'hero-video-media';
  if (poster) {
    const img = poster.querySelector('img');
    if (img) {
      img.loading = 'eager';
      img.setAttribute('fetchpriority', 'high');
    }
    media.append(poster);
  }

  if (videoLink) {
    const video = document.createElement('video');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.setAttribute('aria-hidden', 'true');
    video.src = videoLink.href;
    media.append(video);

    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'hero-video-toggle';
    const sync = () => {
      const playing = !video.paused;
      toggle.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
      toggle.dataset.state = playing ? 'playing' : 'paused';
    };
    toggle.addEventListener('click', () => {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    });
    video.addEventListener('play', sync);
    video.addEventListener('pause', sync);
    sync();
    media.append(toggle);

    // visitors who ask for less motion get the poster and press play themselves
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      video.autoplay = true;
      video.play().catch(() => {});
    }
  }

  const text = document.createElement('div');
  text.className = 'hero-video-text';
  if (eyebrow) {
    eyebrow.className = 'hero-video-eyebrow';
    text.append(eyebrow);
  }
  if (heading) text.append(heading);
  paragraphs.filter((p) => p !== eyebrow).forEach((p) => text.append(p));

  block.replaceChildren(media, text);
}
