// 1. تعريف اسم الكاش
const cacheName = 'nour-rahman-cache-v1';

// 2. قائمة الملفات (تأكد أن هذه الملفات موجودة فعلياً في مشروعك)
const cacheAssets = [
    '/',            // الصفحة الرئيسية
    'index.html',
    'style.css',
    'app.js',
    'manifest.json',
    'icon.png'
];

// حدث التثبيت
self.addEventListener('install', (e) => {
    console.log('Service Worker: Installed');
    e.waitUntil(
        caches.open(cacheName)
            .then(cache => {
                console.log('Service Worker: Caching Files');
                // استخدام catch لمنع توقف الكود إذا تعذر تحميل أحد الملفات
                return cache.addAll(cacheAssets).catch(err => {
                    console.error('Failed to cache some assets:', err);
                });
            })
            .then(() => self.skipWaiting())
    );
});

// حدث التفعيل
self.addEventListener('activate', (e) => {
    console.log('Service Worker: Activated');
    e.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== cacheName) {
                        console.log('Service Worker: Clearing Old Cache');
                        return caches.delete(cache);
                    }
                })
            );
        })
        // هذا السطر يضمن أن الـ Service Worker يتحكم في الصفحة فوراً
        .then(() => self.clients.claim())
    );
});

// حدث الجلب (التعديل الأهم هنا)
self.addEventListener('fetch', (e) => {
    // نتأكد أن الطلب هو GET (لأن الكاش لا يعمل جيداً مع POST وغيره)
    if (e.request.method !== 'GET') {
        return;
    }

    e.respondWith(
        caches.match(e.request)
            .then(response => {
                // إذا وجدنا الملف في الكاش، نرجعه
                if (response) {
                    return response;
                }

                // إذا لم نجده، نجلبه من الإنترنت
                return fetch(e.request).then(response => {
                    // نتأكد أن الاستجابة صحيحة (status 200) وليست خطأ
                    if(!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }

                    // (اختياري) هنا ممكن نضيف الملف الجديد للكاش عشان المرات الجاية
                    // const responseClone = response.clone();
                    // caches.open(cacheName).then(cache => cache.put(e.request, responseClone));

                    return response;
                });
            })
            // (تعديل مهم) التعامل مع حالات انقطاع الإنترنت التام
            .catch(() => {
                // مثلاً: لو المستخدم طلب صفحة مش موجودة في الكاش، نرجعه لصفحة أوفلاين
                // caches.match('/offline.html');
            })
    );
});