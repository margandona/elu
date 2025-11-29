const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Configuración
const INPUT_DIR = __dirname;
const OUTPUT_DIR = path.join(__dirname, 'optimized');
const QUALITY_WEBP = 85; // Calidad WebP (80-90 recomendado)
const QUALITY_JPEG = 85; // Calidad JPEG fallback

// Crear carpeta optimized si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Obtener todas las imágenes PNG y JPG del directorio raíz
const imageExtensions = ['.png', '.jpg', '.jpeg'];
const imageFiles = fs.readdirSync(INPUT_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext) && file !== 'rrss.jpg'; // Excluir rrss.jpg si existe
});

console.log(`\n🎨 Optimizando ${imageFiles.length} imágenes...\n`);

// Función para formatear tamaño de archivo
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// Procesar cada imagen
async function optimizeImage(filename) {
    const inputPath = path.join(INPUT_DIR, filename);
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename, ext);
    
    // Rutas de salida
    const webpPath = path.join(OUTPUT_DIR, `${basename}.webp`);
    const fallbackPath = path.join(OUTPUT_DIR, filename);
    
    try {
        const originalStats = fs.statSync(inputPath);
        const originalSize = originalStats.size;
        
        // Generar WebP optimizado
        await sharp(inputPath)
            .webp({ quality: QUALITY_WEBP, effort: 6 })
            .toFile(webpPath);
        
        const webpStats = fs.statSync(webpPath);
        const webpSize = webpStats.size;
        
        // Generar fallback optimizado (PNG o JPEG)
        if (ext === '.png') {
            await sharp(inputPath)
                .png({ quality: QUALITY_WEBP, compressionLevel: 9, adaptiveFiltering: true })
                .toFile(fallbackPath);
        } else {
            await sharp(inputPath)
                .jpeg({ quality: QUALITY_JPEG, mozjpeg: true })
                .toFile(fallbackPath);
        }
        
        const fallbackStats = fs.statSync(fallbackPath);
        const fallbackSize = fallbackStats.size;
        
        const webpSavings = ((originalSize - webpSize) / originalSize * 100).toFixed(1);
        const fallbackSavings = ((originalSize - fallbackSize) / originalSize * 100).toFixed(1);
        
        console.log(`✅ ${filename}`);
        console.log(`   Original: ${formatBytes(originalSize)}`);
        console.log(`   WebP: ${formatBytes(webpSize)} (ahorro: ${webpSavings}%)`);
        console.log(`   Fallback: ${formatBytes(fallbackSize)} (ahorro: ${fallbackSavings}%)\n`);
        
        return {
            original: originalSize,
            webp: webpSize,
            fallback: fallbackSize
        };
    } catch (error) {
        console.error(`❌ Error procesando ${filename}:`, error.message);
        return null;
    }
}

// Procesar todas las imágenes
async function processAllImages() {
    let totalOriginal = 0;
    let totalWebp = 0;
    let totalFallback = 0;
    
    for (const file of imageFiles) {
        const result = await optimizeImage(file);
        if (result) {
            totalOriginal += result.original;
            totalWebp += result.webp;
            totalFallback += result.fallback;
        }
    }
    
    const totalWebpSavings = ((totalOriginal - totalWebp) / totalOriginal * 100).toFixed(1);
    const totalFallbackSavings = ((totalOriginal - totalFallback) / totalOriginal * 100).toFixed(1);
    
    console.log('═══════════════════════════════════════');
    console.log('📊 RESUMEN DE OPTIMIZACIÓN');
    console.log('═══════════════════════════════════════');
    console.log(`Tamaño total original: ${formatBytes(totalOriginal)}`);
    console.log(`Tamaño total WebP: ${formatBytes(totalWebp)} (ahorro: ${totalWebpSavings}%)`);
    console.log(`Tamaño total fallback: ${formatBytes(totalFallback)} (ahorro: ${totalFallbackSavings}%)`);
    console.log('═══════════════════════════════════════\n');
    console.log('✨ Optimización completada! Las imágenes están en la carpeta "optimized/"');
}

processAllImages().catch(console.error);
