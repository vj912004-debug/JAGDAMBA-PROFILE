import React from 'react';
import isiMarkSvg from '../assets/anms-isi-mark.svg?raw';

/** BIS ISI mark — exact pixel-art SVG from AM/NS MTC template (bundled inline) */
export const AnmsIsiMark: React.FC = () => (
  <span aria-hidden dangerouslySetInnerHTML={{ __html: isiMarkSvg }} />
);
