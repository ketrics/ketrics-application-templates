/**
 * Volume Examples
 *
 * Demonstrates S3-backed file storage operations using ketrics.Volume.
 * Volumes must be granted to the application in the Ketrics portal before use.
 */

/**
 * Save files to a volume - demonstrates writing JSON and binary data.
 */
const saveFile = async () => {
  const volume = await ketrics.Volume.connect("test-volume");

  // Write JSON content
  const jsonData = {
    generatedBy: ketrics.application.code,
    generatedAt: new Date().toISOString(),
    tenant: ketrics.tenant.code,
  };
  const jsonResult = await volume.put("output/data.json", JSON.stringify(jsonData), {
    contentType: "application/json",
  });

  // Write plain text content
  const textResult = await volume.put("output/hello.txt", Buffer.from("Hello from Ketrics!"), {
    contentType: "text/plain",
  });

  return {
    jsonFile: { key: jsonResult.key, etag: jsonResult.etag, size: jsonResult.size },
    textFile: { key: textResult.key, etag: textResult.etag, size: textResult.size },
  };
};

/**
 * Read a file from a volume - demonstrates reading and parsing stored data.
 */
const readFile = async () => {
  const volume = await ketrics.Volume.connect("test-volume");

  const exists = await volume.exists("output/data.json");
  if (!exists) {
    return { error: "File not found. Run saveFile first." };
  }

  const file = await volume.get("output/data.json");
  const content = file.content.toString();

  return {
    contentType: file.contentType,
    contentLength: file.contentLength,
    lastModified: file.lastModified,
    parsed: JSON.parse(content),
  };
};

/**
 * List files in a volume - demonstrates pagination and prefix filtering.
 */
const listFiles = async (payload: { prefix?: string }) => {
  const volume = await ketrics.Volume.connect("test-volume");

  const result = await volume.list({
    prefix: payload?.prefix || "output/",
    maxResults: 50,
  });

  return {
    files: result.files.map((f) => ({
      key: f.key,
      size: f.size,
      lastModified: f.lastModified,
      contentType: f.contentType,
    })),
    count: result.count,
    isTruncated: result.isTruncated,
  };
};

/**
 * Generate a temporary download URL for a file.
 */
const generateDownloadUrl = async () => {
  const volume = await ketrics.Volume.connect("test-volume");
  const result = await volume.generateDownloadUrl("output/data.json", {
    expiresIn: 3600, // 1 hour
  });

  return { url: result.url, expiresAt: result.expiresAt };
};

/**
 * Copy a file within a volume.
 */
const copyFile = async () => {
  const volume = await ketrics.Volume.connect("test-volume");

  const result = await volume.copy("output/data.json", "backup/data-backup.json");

  return {
    sourceKey: result.sourceKey,
    destinationKey: result.destinationKey,
    etag: result.etag,
  };
};

export { saveFile, readFile, listFiles, generateDownloadUrl, copyFile };
