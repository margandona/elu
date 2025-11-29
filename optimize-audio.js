const ffmpeg = require('fluent-ffmpeg');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const fs = require('fs');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegPath);

const INPUT_FILE = 'elu.mp3';
const OUTPUT_DIR = 'optimized';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'elu.mp3');

// Crear carpeta optimized si no existe
if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

console.log('\n🎵 Optimizando audio MP3...\n');

const originalStats = fs.statSync(INPUT_FILE);
const originalSize = originalStats.size;

console.log(`Original: ${formatBytes(originalSize)}`);
console.log('Procesando...\n');

ffmpeg(INPUT_FILE)
    .audioBitrate('96k')      // Reducir bitrate a 96kbps (buena calidad para música de fondo)
    .audioChannels(2)          // Mantener estéreo
    .audioFrequency(44100)     // Frecuencia estándar
    .format('mp3')
    .on('end', () => {
        const optimizedStats = fs.statSync(OUTPUT_FILE);
        const optimizedSize = optimizedStats.size;
        const savings = ((originalSize - optimizedSize) / originalSize * 100).toFixed(1);
        
        console.log('✅ Optimización completada!\n');
        console.log('═══════════════════════════════════════');
        console.log('📊 RESUMEN DE OPTIMIZACIÓN DE AUDIO');
        console.log('═══════════════════════════════════════');
        console.log(`Original: ${formatBytes(originalSize)}`);
        console.log(`Optimizado: ${formatBytes(optimizedSize)}`);
        console.log(`Ahorro: ${savings}% (${formatBytes(originalSize - optimizedSize)})`);
        console.log('═══════════════════════════════════════\n');
        console.log('Configuración aplicada:');
        console.log('- Bitrate: 96 kbps (óptimo para web)');
        console.log('- Canales: Estéreo');
        console.log('- Frecuencia: 44.1 kHz');
        console.log('\n💡 El audio optimizado está en: optimized/elu.mp3');
    })
    .on('error', (err) => {
        console.error('❌ Error al optimizar audio:', err.message);
        console.log('\n⚠️  Si el error persiste, intenta con bitrate más alto:');
        console.log('   Edita optimize-audio.js y cambia .audioBitrate("96k") a "128k"');
    })
    .save(OUTPUT_FILE);
