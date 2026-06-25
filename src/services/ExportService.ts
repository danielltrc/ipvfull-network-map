import Papa from 'papaparse';
import { jsPDF } from 'jspdf';
import { toPng, toSvg } from 'html-to-image';
import { NetworkTopology } from '../types';
import { TopologyBuilder } from '../models/NetworkTopology';

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export class ExportService {
  static exportJSON(topology: NetworkTopology): void {
    const serialized = TopologyBuilder.toSerialized(topology);
    const json = JSON.stringify(serialized, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    downloadBlob(blob, `ipvfull-topology-${Date.now()}.json`);
  }

  static exportCSV(topology: NetworkTopology): void {
    const devices = Object.values(topology.devices).map((d) => ({
      id: d.id,
      label: d.label,
      type: d.type,
      model: d.model ?? '',
      vendor: d.vendor ?? '',
      ip: d.ip ?? '',
      hostname: d.hostname ?? '',
      status: d.status,
      lat: d.geo?.lat ?? '',
      lng: d.geo?.lng ?? '',
      tags: d.tags?.join(',') ?? '',
    }));

    const links = Object.values(topology.links).map((l) => ({
      id: l.id,
      source: l.sourceId,
      target: l.targetId,
      type: l.type,
      status: l.status,
      label: l.label ?? '',
      capacityBps: l.metrics.capacityBps ?? '',
      rxBps: l.metrics.rxBps ?? '',
      txBps: l.metrics.txBps ?? '',
      latencyMs: l.metrics.latencyMs ?? '',
      lossPercent: l.metrics.lossPercent ?? '',
    }));

    const deviceCsv = Papa.unparse(devices);
    const linkCsv = Papa.unparse(links);

    downloadBlob(new Blob([deviceCsv], { type: 'text/csv' }), `ipvfull-devices-${Date.now()}.csv`);

    setTimeout(() => {
      downloadBlob(new Blob([linkCsv], { type: 'text/csv' }), `ipvfull-links-${Date.now()}.csv`);
    }, 200);
  }

  static async exportPNG(container: HTMLElement): Promise<void> {
    const dataUrl = await toPng(container, {
      backgroundColor: '#0a0f1e',
      pixelRatio: 2,
    });
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `ipvfull-topology-${Date.now()}.png`;
    a.click();
  }

  static async exportSVG(container: HTMLElement): Promise<void> {
    const dataUrl = await toSvg(container, {
      backgroundColor: '#0a0f1e',
    });
    const blob = new Blob([dataUrl], { type: 'image/svg+xml' });
    downloadBlob(blob, `ipvfull-topology-${Date.now()}.svg`);
  }

  static async exportPDF(container: HTMLElement, topology: NetworkTopology): Promise<void> {
    const dataUrl = await toPng(container, {
      backgroundColor: '#0a0f1e',
      pixelRatio: 1.5,
    });

    const img = new Image();
    img.src = dataUrl;
    await new Promise<void>((resolve) => {
      img.onload = () => resolve();
    });

    const pdf = new jsPDF({
      orientation: img.width > img.height ? 'landscape' : 'portrait',
      unit: 'px',
      format: [img.width, img.height + 60],
    });

    // Header
    pdf.setFontSize(14);
    pdf.setTextColor(200, 200, 200);
    pdf.text('IPvFull Network Map', 20, 30);
    pdf.setFontSize(10);
    pdf.text(
      `Devices: ${Object.keys(topology.devices).length} | Links: ${Object.keys(topology.links).length} | ${new Date().toLocaleString()}`,
      20,
      48
    );

    pdf.addImage(dataUrl, 'PNG', 0, 60, img.width, img.height);

    pdf.save(`ipvfull-topology-${Date.now()}.pdf`);
  }
}
