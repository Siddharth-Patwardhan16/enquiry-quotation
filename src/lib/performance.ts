// Performance utilities for CLS optimization

export const preloadCriticalResources = () => {
  if (typeof window === 'undefined') return;

  // Preload critical fonts
  const preloadFont = (href: string, as: string = 'font') => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  };

  // Preload critical CSS
  const preloadCSS = (href: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = 'style';
    document.head.appendChild(link);
  };

  // Preload critical images
  const preloadImage = (src: string) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = src;
    link.as = 'image';
    document.head.appendChild(link);
  };

  return { preloadFont, preloadCSS, preloadImage };
};

interface LayoutShiftEntry extends PerformanceEntry {
  hadRecentInput?: boolean;
  value: number;
}

export const measureCLS = () => {
  if (typeof window === 'undefined') return;

  let clsValue = 0;
  let clsEntries: LayoutShiftEntry[] = [];

  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const layoutShiftEntry = entry as LayoutShiftEntry;
      // Only count layout shifts without recent user input
      if (!layoutShiftEntry.hadRecentInput) {
        const firstSessionEntry = clsEntries[0];
        const lastSessionEntry = clsEntries[clsEntries.length - 1];

        // If the entry occurred less than 1 second after the previous entry
        // and less than 5 seconds after the first entry in the session,
        // include the entry in the current session. Otherwise, start a new session.
        if (
          clsValue &&
          entry.startTime - (lastSessionEntry?.startTime ?? 0) < 1000 &&
          entry.startTime - (firstSessionEntry?.startTime ?? 0) < 5000
        ) {
          clsValue += layoutShiftEntry.value;
          clsEntries.push(layoutShiftEntry);
        } else {
          clsValue = layoutShiftEntry.value;
          clsEntries = [layoutShiftEntry];
        }
      }
    }
  });

  observer.observe({ entryTypes: ['layout-shift'] });

  return {
    getCLS: () => clsValue,
    getCLSEntries: () => clsEntries,
    disconnect: () => observer.disconnect(),
  };
};

export const optimizeImages = () => {
  if (typeof window === 'undefined') return;

  // Add loading="lazy" to all images that don't have it
  const images = document.querySelectorAll('img:not([loading])');
  images.forEach((img) => {
    img.setAttribute('loading', 'lazy');
  });

  // Add proper dimensions to prevent layout shift
  const imagesWithoutDimensions = document.querySelectorAll('img:not([width]):not([height])');
  imagesWithoutDimensions.forEach((img) => {
    const rect = img.getBoundingClientRect();
    if (rect.width && rect.height) {
      img.setAttribute('width', rect.width.toString());
      img.setAttribute('height', rect.height.toString());
    }
  });
};

export const debounce = <T extends (..._args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((..._args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (..._args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(..._args), wait);
  };
};

export const throttle = <T extends (..._args: unknown[]) => unknown>(
  func: T,
  limit: number
): ((..._args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (..._args: Parameters<T>) => {
    if (!inThrottle) {
      func(..._args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};

export const isSlowConnection = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const connection = (navigator as Navigator & { 
    connection?: { effectiveType?: string; saveData?: boolean };
    mozConnection?: { effectiveType?: string; saveData?: boolean };
    webkitConnection?: { effectiveType?: string; saveData?: boolean };
  }).connection ?? 
  (navigator as Navigator & { mozConnection?: { effectiveType?: string; saveData?: boolean } }).mozConnection ?? 
  (navigator as Navigator & { webkitConnection?: { effectiveType?: string; saveData?: boolean } }).webkitConnection;
  
  if (connection) {
    return connection.effectiveType === 'slow-2g' || 
           connection.effectiveType === '2g' ||
           connection.saveData === true;
  }
  
  return false;
};

export const isLowEndDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const navigatorWithMemory = navigator as Navigator & { deviceMemory?: number };
  
  return (
    (navigator.hardwareConcurrency ?? 4) <= 2 ||
    (navigatorWithMemory.deviceMemory ?? 4) <= 2 ||
    /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  );
};
