// controllers/StreamController.js
// Contrôleur pour le streaming audio

const Track = require('../models/Track');
const fs = require('fs');

class StreamController {
  /**
   * GET /stream/:trackId
   * Streaming audio avec support range
   */
  static async stream(req, res) {
    try {
      const track = await Track.getById(req.params.trackId);
      
      if (!track) {
        return res.status(404).json({ error: 'Track not found' });
      }
      
      const filePath = track.file_path;
      
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'File not found' });
      }
      
      const stat = fs.statSync(filePath);
      const range = req.headers.range;
      
      if (range) {
        const parts = range.replace(/bytes=/, '').split('-');
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        
        res.writeHead(206, {
          'Content-Range': `bytes ${start}-${end}/${stat.size}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'audio/mpeg'
        });
        
        file.pipe(res);
      } else {
        res.writeHead(200, {
          'Content-Length': stat.size,
          'Content-Type': 'audio/mpeg'
        });
        
        fs.createReadStream(filePath).pipe(res);
      }
      
      // Incrémenter le compteur de lecture
      await Track.incrementPlayCount(req.params.trackId);
      
    } catch (error) {
      console.error('Erreur streaming:', error);
      res.status(500).json({ error: 'Streaming error' });
    }
  }
}

module.exports = StreamController;
