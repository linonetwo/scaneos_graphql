// @flow
import fetch, { Request, Headers } from 'node-fetch';
import camelize from 'camelize';

export const PAGE_SIZE_DEFAULT = 60;

export const API = 'https://scaneos.io/api';
export const EOS_API = 'https://scaneos.io/eosapi/v1';
export default (path: string) =>
  fetch(`${API}${path}`)
    .then(res => res.json())
    .then(camelize);

export const postEOS = (path: string, body: Object) =>
  fetch(`${EOS_API}${path}`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
    .then(res => res.json())
    .then(camelize);

export const MAPBOX_TOKEN =
  'pk.eyJ1IjoibGlub25ldHdvMDEyIiwiYSI6ImNqaHhjcHhmcjBhZDkzcXBxejh3a3RrOGUifQ.EOAmFP8NJxRc_iLce8VCVw';
export const CMS_TOKEN = 'aQVetMaDdbxSPORiloeWjNYBgkaIyggs';

export const CMS_BASE = 'https://scaneos.io/cmsapi/';
export const CMS_API = `${CMS_BASE}api/1.1/`;

export const getCMS = (path: string) =>
  fetch(
    new Request(`${CMS_API}${path}`, {
      headers: new Headers({ Authorization: `Bearer ${CMS_TOKEN}`, 'Content-Type': 'application/json' }),
    }),
  )
    .then(res => res.json())
    .then(camelize);
