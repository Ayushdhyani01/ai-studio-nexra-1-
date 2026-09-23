/** Known users + their usual device/location (mirrors the training CSV). Used by the employee portal. */
export interface KnownUser {
  userId: string;
  userEmail: string;
  device: string;
  location: string;
  ipAddress: string;
}

export const KNOWN_USERS: KnownUser[] = [
  { userId: "usr-alex", userEmail: "alex@company.com", device: "Apple MacBook Pro M3", location: "Austin, TX, US", ipAddress: "136.56.88.14" },
  { userId: "usr-maya", userEmail: "maya@company.com", device: "Dell Latitude 7440", location: "San Jose, CA, US", ipAddress: "192.0.2.45" },
  { userId: "usr-elena", userEmail: "elena@company.com", device: "Apple MacBook Pro 16", location: "Seattle, WA, US", ipAddress: "203.0.113.21" },
  { userId: "usr-dmitri", userEmail: "dmitri@company.com", device: "Lenovo ThinkStation P620", location: "Berlin, DE", ipAddress: "198.51.100.34" },
  { userId: "usr-marcus", userEmail: "marcus@company.com", device: "Lenovo ThinkPad P1", location: "San Francisco, CA, US", ipAddress: "203.0.113.55" },
  { userId: "usr-sarah", userEmail: "sarah@company.com", device: "Dell XPS 15 9530", location: "Denver, CO, US", ipAddress: "198.51.100.78" },
  { userId: "usr-david", userEmail: "david@company.com", device: "Apple MacBook Pro M2", location: "New York, NY, US", ipAddress: "192.0.2.90" },
  { userId: "usr-priya", userEmail: "priya@company.com", device: "Surface Laptop 5", location: "Chicago, IL, US", ipAddress: "203.0.113.102" },
  { userId: "usr-jordan", userEmail: "jordan@company.com", device: "MacBook Air M2", location: "Boston, MA, US", ipAddress: "198.51.100.120" },
  { userId: "usr-carlos", userEmail: "carlos@company.com", device: "Dell Precision 5570", location: "Austin, TX, US", ipAddress: "192.0.2.130" },
];

export interface PortalLocation {
  label: string;
  location: string;
  ipAddress: string;
  /** false = attack region (unrecognized device is used) */
  baseline: boolean;
}

export const PORTAL_LOCATIONS: PortalLocation[] = [
  { label: "Austin, TX — office", location: "Austin, TX, US", ipAddress: "136.56.88.14", baseline: true },
  { label: "Mumbai, India", location: "Mumbai, India", ipAddress: "49.37.113.9", baseline: false },
  { label: "Delhi, India", location: "Delhi, India", ipAddress: "157.34.210.44", baseline: false },
];

export const UNKNOWN_DEVICE = "Chrome 131 · Windows 11 (Unrecognized PC)";
