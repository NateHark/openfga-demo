import { v4 as uuidv4 } from 'uuid';
import base from 'base-x';

const BASE62 = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export default function uniqueId(prefix) {
  const buffer = [];
  const base62 = base(BASE62);
  uuidv4(null, buffer);
  return `${prefix}_${base62.encode(buffer)}`;
}
