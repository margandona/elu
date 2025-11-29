const sharp = require('sharp');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const INPUT_DIR = __dirname;
const OUTPUT_DIR = path.join(__dirname, 'optimized');
const QUALITY_WEBP = 85;
const QUALITY_JPEG = 85;
const AUDIO_BITRATE = '96k';

if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const imageExtensions = ['.png', '.jpg', '.jpeg'];
const imageFiles = fs.readdirSync(INPUT_DIR).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return imageExtensions.includes(ext) && file !== 'rrss.jpg';
});

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

console.log('\n🚀 OPTIMIZACIÓN COMPLETA - IMÁGENES Y AUDIO\n');
console.log('═══════════════════════════════════════\n');

// Optimizar imágenes
async function optimizeImage(filename) {
    const inputPath = path.join(INPUT_DIR, filename);
    const ext = path.extname(filename).toLowerCase();
    const basename = path.basename(filename, ext);
    
    const webpPath = path.join(OUTPUT_DIR, `${basename}.webp`);
    const fallbackPath = path.join(OUTPUT_DIR, filename);
    
    try {
        const originalStats = fs.statSync(inputPath);
        const originalSize = originalStats.size;
        
        await sharp(inputPath)
            .webp({ quality: QUALITY_WEBP, effort: 6 })
            .toFile(webpPath);
        
        const webpStats = fs.statSync(webpPath);
        const webpSize = webpStats.size;
        
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
        
        console.log(`✅ ${filename} → ${formatBytes(webpSize)} (ahorro: ${webpSavings}%)`);
        
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

async function optimizeAudio() {
    const audioFile = 'elu.mp3';
    if (!fs.existsSync(audioFile)) {
        console.log('\n⚠️  No se encontró elu.mp3 - saltando optimización de audio\n');
        return null;
    }

    return new Promise((resolve, reject) => {
        const originalStats = fs.statSync(audioFile);
        const originalSize = originalStats.size;
        const outputFile = path.join(OUTPUT_DIR, 'elu.mp3');

        console.log('\n🎵 Optimizando audio...');

        ffmpeg(audioFile)
            .audioBitrate(AUDIO_BITRATE)
            .audioChannels(2)
            .audioFrequency(44100)
            .format('mp3')
            .on('end', () => {
                const optimizedStats = fs.statSync(outputFile);
                const optimizedSize = optimizedStats.size;
                const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
                
                console.log(`✅ elu.mp3 → ${formatBytes(optimizedSize)} (ahorro: ${savings}%)`);
                
                resolve({
                    original: originalSize,
                    optimized: optimizedSize
                });
            })
            .on('error', (err) => {
                console.error('❌ Error al optimizar audio:', err.message);
                resolve(null);
            })
            .save(outputFile);
    });
}

async function processAll() {
    console.log('📸 Optimizando imágenes...\n');
    
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
    
    const audioResult = await optimizeAudio();
    
    console.log('\n═══════════════════════════════════════');
    console.log('📊 RESUMEN FINAL');
    console.log('═══════════════════════════════════════');
    
    if (imageFiles.length > 0) {
        const totalWebpSavings = ((totalOriginal - totalWebp) / totalOriginal * 100).toFixed(1);
        console.log(`\n🖼️  IMÁGENES (${imageFiles.length} archivos)`);
        console.log(`Original: ${formatBytes(totalOriginal)}`);
        console.log(`WebP: ${formatBytes(totalWebp)} (ahorro: ${totalWebpSavings}%)`);
    }
    
    if (audioResult) {
        const audioSavings = ((audioResult.original - audioResult.optimized) / audioResult.original * 100).toFixed(1);
        console.log(`\n🎵 AUDIO`);
        console.log(`Original: ${formatBytes(audioResult.original)}`);
        console.log(`Optimizado: ${formatBytes(audioResult.optimized)} (ahorro: ${audioSavings}%)`);
    }
    
    const grandTotal = totalOriginal + (audioResult ? audioResult.original : 0);
    const grandOptimized = totalWebp + (audioResult ? audioResult.optimized : 0);
    const grandSavings = ((grandTotal - grandOptimized) / grandTotal * 100).toFixed(1);
    
    console.log(`\n💫 TOTAL GENERAL`);
    console.log(`Original: ${formatBytes(grandTotal)}`);
    console.log(`Optimizado: ${formatBytes(grandOptimized)}`);
    console.log(`Ahorro: ${grandSavings}% (${formatBytes(grandTotal - grandOptimized)})`);
    console.log('═══════════════════════════════════════\n');
    console.log('✨ Todo listo! Archivos en carpeta "optimized/"');
    console.log('💡 El sitio cargará mucho más rápido ahora\n');
}

processAll().catch(console.error);
