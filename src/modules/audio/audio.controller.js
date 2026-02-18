import { ok } from '../../utils/response.util.js';
import * as audioService from './audio.service.js';

export async function createAudio(req, res, next) {
  try {
    if (!req.file) {
      return next(new Error('File is required'));
    }
    const payload = {
      title: req.body.title,
      sourate: req.body.sourate,
      versetStart: req.body.versetStart ?? null,
      versetEnd: req.body.versetEnd ?? null,
      description: req.body.description,
      filePath: req.file.path,
      addBasmala: req.body.addBasmala === true
    };
    const audio = await audioService.createAudioEntry(payload);
    return ok(res, audio, 201);
  } catch (err) {
    return next(err);
  }
}

export async function listAudios(req, res, next) {
  try {
    const audios = await audioService.listAllAudios({ sourate: req.query.sourate });
    return ok(res, audios, 200);
  } catch (err) {
    return next(err);
  }
}

export async function getAudio(req, res, next) {
  try {
    const audio = await audioService.getAudio(req.params.id);
    return ok(res, audio, 200);
  } catch (err) {
    return next(err);
  }
}

export async function updateAudio(req, res, next) {
  try {
    const audio = await audioService.updateAudioMetadata(req.params.id, req.body);
    return ok(res, audio, 200);
  } catch (err) {
    return next(err);
  }
}

export async function deleteAudio(req, res, next) {
  try {
    await audioService.removeAudio(req.params.id);
    return ok(res, { status: 'deleted' }, 200);
  } catch (err) {
    return next(err);
  }
}

export async function streamAudio(req, res, next) {
  try {
    await audioService.streamAudio(res, req.params.id, req.headers.range);
  } catch (err) {
    return next(err);
  }
}

export async function downloadAudio(req, res, next) {
  try {
    return await audioService.downloadAudio(res, req.params.id);
  } catch (err) {
    return next(err);
  }
}
