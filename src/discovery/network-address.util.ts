import { networkInterfaces } from 'node:os';

/** Interface name patterns that never carry real LAN traffic. */
const IGNORED_INTERFACE_PATTERN =
  /virtualbox|vmware|docker|vethernet|hyper-v|loopback|npcap|tap|tailscale|zerotier|wsl|utun|veth|pseudo/i;

/** Interface name patterns that are almost always the "real" NIC on Windows. */
const PREFERRED_INTERFACE_PATTERN = /^(eth|en|wi-?fi|wlan)/i;

export interface LanInterfaceInfo {
  name: string;
  address: string;
  netmask: string;
  broadcast: string;
}

function isPrivateRange(address: string): boolean {
  return /^10\.|^192\.168\.|^172\.(1[6-9]|2\d|3[0-1])\./.test(address);
}

function computeBroadcastAddress(address: string, netmask: string): string | null {
  const addrParts = address.split('.').map(Number);
  const maskParts = netmask.split('.').map(Number);
  if (addrParts.length !== 4 || maskParts.length !== 4) {
    return null;
  }
  if (addrParts.some(Number.isNaN) || maskParts.some(Number.isNaN)) {
    return null;
  }
  const broadcastParts = addrParts.map((part, i) => (part | (~maskParts[i] & 0xff)) >>> 0);
  return broadcastParts.join('.');
}

/**
 * Picks the most likely "real" LAN IPv4 interface, skipping loopback,
 * link-local (APIPA), and known virtual/VPN adapters. Can be overridden
 * with HFCL_DISCOVERY_BIND_IP for machines with unusual network setups.
 */
export function getActiveLanInterface(): LanInterfaceInfo | null {
  const override = process.env.HFCL_DISCOVERY_BIND_IP?.trim();
  if (override) {
    return { name: 'override', address: override, netmask: '255.255.255.0', broadcast: '255.255.255.255' };
  }

  const interfaces = networkInterfaces();
  const candidates: LanInterfaceInfo[] = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs || IGNORED_INTERFACE_PATTERN.test(name)) {
      continue;
    }
    for (const addr of addrs) {
      if (addr.family !== 'IPv4' || addr.internal) {
        continue;
      }
      if (addr.address.startsWith('169.254.')) {
        continue; // APIPA - no DHCP lease
      }
      candidates.push({
        name,
        address: addr.address,
        netmask: addr.netmask,
        broadcast: computeBroadcastAddress(addr.address, addr.netmask) ?? '255.255.255.255',
      });
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  candidates.sort((a, b) => {
    const aPreferred = PREFERRED_INTERFACE_PATTERN.test(a.name) ? 0 : 1;
    const bPreferred = PREFERRED_INTERFACE_PATTERN.test(b.name) ? 0 : 1;
    if (aPreferred !== bPreferred) {
      return aPreferred - bPreferred;
    }
    const aPrivate = isPrivateRange(a.address) ? 0 : 1;
    const bPrivate = isPrivateRange(b.address) ? 0 : 1;
    return aPrivate - bPrivate;
  });

  return candidates[0];
}

export function getActiveLanIpv4(): string | null {
  return getActiveLanInterface()?.address ?? null;
}
