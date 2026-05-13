// ============================================
// VORTEXHUB - ADVANCED JAVASCRIPT ENGINE
// ============================================

// ============ THEME TOGGLE ============
const themeToggle = document.getElementById('themeToggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function updateTheme(isDark) {
  if (isDark) {
    document.body.classList.add('dark-mode');
    localStorage.setItem('theme', 'dark');
    themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
  } else {
    document.body.classList.remove('dark-mode');
    localStorage.setItem('theme', 'light');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
  }
}

// Load saved theme
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  updateTheme(savedTheme === 'dark');
} else {
  updateTheme(prefersDark.matches);
}

themeToggle.addEventListener('click', () => {
  const isDark = document.body.classList.contains('dark-mode');
  updateTheme(!isDark);
});

// ============ NAVBAR SCROLL EFFECT ============
const navbar = document.getElementById('navbar');
const navLinks = document.querySelectorAll('.nav-link');
const sections = document.querySelectorAll('section[id]');

window.addEventListener('scroll', function() {
  // Add shadow to navbar on scroll
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }

  // Update active nav link
  let current = '';
  sections.forEach(section => {
    const sectionTop = section.offsetTop;
    if (scrollY >= sectionTop - 300) {
      current = section.getAttribute('id');
    }
  });

  navLinks.forEach(link => {
    link.classList.remove('active');
    const href = link.getAttribute('href');
    if (href.substring(1) === current) {
      link.classList.add('active');
    }
  });
});

// ============ HAMBURGER MENU ============
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('navMenu');

hamburger.addEventListener('click', () => {
  hamburger.classList.toggle('active');
  navMenu.classList.toggle('active');
});

navLinks.forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
  });
});

// ============ INPUT HANDLING ============
const urlInput = document.getElementById('url');
const clearBtn = document.getElementById('clearBtn');

urlInput.addEventListener('focus', function() {
  if (this.value) {
    clearBtn.style.display = 'block';
  }
});

urlInput.addEventListener('blur', function() {
  if (!this.value) {
    clearBtn.style.display = 'none';
  }
});

urlInput.addEventListener('input', function() {
  if (this.value) {
    clearBtn.style.display = 'block';
  } else {
    clearBtn.style.display = 'none';
  }
});

// ============ LOADING SPINNER ============
function showLoading() {
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = 'flex';
}

function hideLoading() {
  const spinner = document.getElementById('loadingSpinner');
  spinner.style.display = 'none';
}

// ============ CORS PROXY URLS ============
const CORS_PROXIES = [
  'https://api.allorigins.win/get?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://proxy.cors.sh/'
];

// Helper function to bypass CORS
async function fetchWithCORSProxy(url, proxyIndex = 0) {
  if (proxyIndex >= CORS_PROXIES.length) {
    throw new Error('All CORS proxies failed');
  }

  try {
    // Try direct fetch first
    const response = await fetch(url, {
      headers: {
        'Accept': '*/*'
      },
      mode: 'cors',
      credentials: 'omit'
    });
    return response;
  } catch (error) {
    // If direct fetch fails, try CORS proxy
    if (proxyIndex < CORS_PROXIES.length) {
      try {
        const proxyUrl = CORS_PROXIES[proxyIndex] + encodeURIComponent(url);
        const response = await fetch(proxyUrl, {
          headers: {
            'Accept': '*/*',
            'Origin': window.location.origin
          },
          mode: 'cors'
        });
        return response;
      } catch (proxyError) {
        return fetchWithCORSProxy(url, proxyIndex + 1);
      }
    }
    throw error;
  }
}

// ============ FETCH MEDIA ============
async function fetchMedia() {
  const url = document.getElementById('url').value.trim();
  
  if (!url) {
    showToast('Paste URL terlebih dahulu!', 'error');
    return;
  }

  clearPreview();
  showLoading();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 20000);

    // Main API call with better CORS handling
    const response = await fetch(`https://api.theresav.biz.id/download/aio?url=${encodeURIComponent(url)}&apikey=P4QlB`, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      mode: 'cors',
      credentials: 'omit'
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 0 || response.type === 'opaque') {
        throw new Error('CORS Error - Server tidak mengizinkan akses');
      }
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    hideLoading();

    if (!data.status) {
      showToast('API Error. Silakan coba lagi.', 'error');
      return;
    }

    if (!data.result || !data.result.medias || data.result.medias.length === 0) {
      showToast('Media tidak ditemukan. Check URL Anda.', 'error');
      return;
    }

    const mediaPreview = document.getElementById('media-preview');
    const medias = data.result.medias;
    const platformName = data.result.source || "Unknown";
    const caption = data.result.title || "No caption";

    mediaPreview.innerHTML = '';

    const videoMedia = medias.find(media => media.type === 'video');
    if (videoMedia && videoMedia.url) {
      // Use CORS-enabled video source
      const videoUrl = videoMedia.url;
      mediaPreview.innerHTML += `<video controls width="100%" crossorigin="anonymous" style="border-radius: 8px;"><source src="${videoUrl}" type="video/mp4">Browser Anda tidak mendukung video tag</video>`;
      document.getElementById('download-video-btn').disabled = false;
      window.videoDownloadLink = videoUrl;
    } else {
      document.getElementById('download-video-btn').disabled = true;
    }

    const musicMedia = medias.find(media => media.type === 'audio');
    if (musicMedia && musicMedia.url) {
      const audioUrl = musicMedia.url;
      mediaPreview.innerHTML += `<audio controls width="100%" crossorigin="anonymous" style="width: 100%; margin-top: 1rem;"><source src="${audioUrl}" type="audio/mpeg">Browser Anda tidak mendukung audio tag</audio>`;
      document.getElementById('download-music-btn').disabled = false;
      window.musicDownloadLink = audioUrl;
    } else {
      document.getElementById('download-music-btn').disabled = true;
    }

    if (!videoMedia && !musicMedia) {
      showToast('Media tidak ditemukan.', 'error');
      return;
    }

    document.getElementById('platform').textContent = platformName;
    document.getElementById('caption').textContent = caption.substring(0, 100) + (caption.length > 100 ? '...' : '');

    showResult();
    showToast('✨ Media dimuat berhasil!', 'success');

  } catch (error) {
    hideLoading();
    console.error('VortexHub Error:', error);
    
    if (error.name === 'AbortError') {
      showToast('Timeout. Coba lagi.', 'error');
    } else if (error.message.includes('CORS')) {
      showToast('CORS Error - Coba lagi dengan URL berbeda.', 'error');
    } else if (error.message.includes('Failed to fetch')) {
      showToast('Network Error - Periksa koneksi internet Anda.', 'error');
    } else {
      showToast('Error: ' + error.message, 'error');
    }
  }
}

// ============ SHOW/HIDE RESULT ============
function showResult() {
  const resultSection = document.getElementById('result');
  resultSection.style.display = 'block';
  resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function hideResult() {
  document.getElementById('result').style.display = 'none';
  document.getElementById('url').value = '';
  document.getElementById('clearBtn').style.display = 'none';
}

// ============ ADVANCED AUTO DOWNLOAD WITH CORS HANDLING ============
function autoDownload(type) {
  let downloadLink;

  if (type === 'video') {
    downloadLink = window.videoDownloadLink;
  } else if (type === 'music') {
    downloadLink = window.musicDownloadLink;
  }

  if (!downloadLink) {
    showToast('Link tidak tersedia.', 'error');
    return;
  }

  const downloadBtn = document.getElementById(`download-${type}-btn`);
  const originalHTML = downloadBtn.innerHTML;
  downloadBtn.innerHTML = '<div class="option-icon"><i class="fas fa-spinner fa-spin"></i></div><div class="option-info"><h4>Downloading...</h4><p>Jangan tutup halaman</p></div><i class="fas fa-arrow-right"></i>';
  downloadBtn.disabled = true;

  // Multiple download strategies
  downloadWithRetry(downloadLink, type, downloadBtn, originalHTML, 0);
}

async function downloadWithRetry(url, type, downloadBtn, originalHTML, attempt = 0) {
  const maxAttempts = 3;

  try {
    // Strategy 1: Direct fetch with CORS
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': '*/*',
        'Origin': window.location.origin
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error("File kosong - Download gagal");
    }

    // Successfully downloaded, create download link
    downloadFile(blob, type, downloadBtn, originalHTML);

  } catch (err) {
    console.error(`Download attempt ${attempt + 1} failed:`, err);

    if (attempt < maxAttempts - 1) {
      // Retry with slight delay
      showToast(`Retry download... (Attempt ${attempt + 2}/${maxAttempts})`, 'error');
      setTimeout(() => {
        downloadWithRetry(url, type, downloadBtn, originalHTML, attempt + 1);
      }, 1000);
    } else {
      // All attempts failed, try alternative method
      console.log('Trying alternative download method...');
      downloadFileWithElement(url, type, downloadBtn, originalHTML);
    }
  }
}

function downloadFile(blob, type, downloadBtn, originalHTML) {
  try {
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = generateFileName(type);
    a.style.display = 'none';
    document.body.appendChild(a);
    
    // Trigger download
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
      showToast('⚡ Download berhasil!', 'success');
      hideResult();
    }, 100);

  } catch (err) {
    console.error('Download file error:', err);
    downloadBtn.innerHTML = originalHTML;
    downloadBtn.disabled = false;
    showToast('Download error: ' + err.message, 'error');
  }
}

// Alternative download using anchor tag directly
function downloadFileWithElement(url, type, downloadBtn, originalHTML) {
  try {
    const a = document.createElement('a');
    a.href = url;
    a.download = generateFileName(type);
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.style.display = 'none';
    document.body.appendChild(a);
    
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      downloadBtn.innerHTML = originalHTML;
      downloadBtn.disabled = false;
      showToast('⚡ Download dimulai!', 'success');
      hideResult();
    }, 500);

  } catch (err) {
    console.error('Alternative download error:', err);
    downloadBtn.innerHTML = originalHTML;
    downloadBtn.disabled = false;
    showToast('Download error: ' + err.message, 'error');
  }
}

// ============ GENERATE FILE NAME ============
function generateFileName(type) {
  const timestamp = new Date().getTime();
  const randomSuffix = Math.random().toString(36).substr(2, 5);
  const extension = type === 'video' ? 'mp4' : 'mp3';
  return `VortexHub_${timestamp}_${randomSuffix}.${extension}`;
}

// ============ CLEAR PREVIEW ============
function clearPreview() {
  document.getElementById('media-preview').innerHTML = `
    <div class="preview-placeholder">
      <i class="fas fa-film"></i>
      <p>Media akan ditampilkan di sini</p>
    </div>
  `;
  document.getElementById('download-video-btn').disabled = true;
  document.getElementById('download-music-btn').disabled = true;
  
  window.videoDownloadLink = null;
  window.musicDownloadLink = null;
}

// ============ TOGGLE FAQ ============
function toggleFAQ(element) {
  const faqItem = element.parentElement;
  const isActive = faqItem.classList.contains('active');
  
  document.querySelectorAll('.faq-item').forEach(item => {
    item.classList.remove('active');
  });
  
  if (!isActive) {
    faqItem.classList.add('active');
  }
}

// ============ TOAST NOTIFICATION ============
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  
  toastMessage.textContent = message;
  toast.style.display = 'flex';
  
  // Change color based on type
  if (type === 'error') {
    toast.style.background = 'linear-gradient(135deg, #ff4757, #ff006e)';
    toast.innerHTML = '<i class="fas fa-exclamation-circle"></i><span>' + message + '</span>';
  } else {
    toast.style.background = 'linear-gradient(135deg, #06ffa5, #00d4ff)';
    toast.innerHTML = '<i class="fas fa-check-circle"></i><span>' + message + '</span>';
  }

  setTimeout(() => {
    toast.style.display = 'none';
  }, 3000);
}

// ============ SMOOTH SCROLL ============
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      target.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    }
  });
});

// ============ INTERSECTION OBSERVER FOR ANIMATIONS ============
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
    }
  });
}, observerOptions);

// Observe all elements with animations
document.querySelectorAll('.feature-card, .platform-item, .faq-item, .footer-section').forEach(el => {
  observer.observe(el);
});

// ============ KEYBOARD SHORTCUTS ============
document.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + K to focus input
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
    e.preventDefault();
    urlInput.focus();
  }

  // Escape to close result
  if (e.key === 'Escape') {
    const resultSection = document.getElementById('result');
    if (resultSection.style.display !== 'none') {
      hideResult();
    }
  }

  // Enter to search
  if (e.key === 'Enter' && document.activeElement === urlInput) {
    fetchMedia();
  }
});

// ============ PERFORMANCE OPTIMIZATION ============
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Optional: Register service worker for offline support
    // navigator.serviceWorker.register('sw.js');
  });
}

// ============ INITIALIZE ============
document.addEventListener('DOMContentLoaded', function() {
  clearPreview();
  
  // Add fade-in animation to body
  document.body.style.animation = 'fadeInUp 0.6s ease';
  
  // Log initialization
  console.log('%c╔═══════════════════════════════╗', 'color: #00d4ff; font-size: 12px;');
  console.log('%c║  🌀 VORTEXHUB INITIALIZED  🌀  ║', 'color: #00d4ff; font-size: 12px; font-weight: bold;');
  console.log('%c╚═══════════════════════════════╝', 'color: #00d4ff; font-size: 12px;');
  console.log('%cWelcome to VortexHub - Premium Media Downloader', 'color: #8338ec; font-size: 14px; font-weight: bold;');
});

// ============ PREVENT DOUBLE CLICK ON BUTTONS ============
document.querySelectorAll('button').forEach(btn => {
  btn.addEventListener('dblclick', (e) => {
    e.preventDefault();
  });
});

// ============ PAGE VISIBILITY ============
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    console.log('%cVortexHub: Page hidden', 'color: #00d4ff;');
  } else {
    console.log('%cVortexHub: Page visible', 'color: #06ffa5;');
  }
});

// ============ UNLOAD WARNING ============
window.addEventListener('beforeunload', (e) => {
  const resultSection = document.getElementById('result');
  if (resultSection.style.display !== 'none') {
    e.preventDefault();
    e.returnValue = '';
  }
});

// ============ VORTEX EFFECTS ============
// Parallax effect on mouse move
document.addEventListener('mousemove', (e) => {
  const orbs = document.querySelectorAll('.orb');
  const mouseX = e.clientX / window.innerWidth;
  const mouseY = e.clientY / window.innerHeight;
  
  orbs.forEach((orb, index) => {
    const offset = (index + 1) * 20;
    orb.style.transform = `translate(${mouseX * offset}px, ${mouseY * offset}px)`;
  });
});
