import { resourcesApi } from "@repo/api";

type ManagedDocumentIdentity = {
  id: number;
  uuid: string;
  folderId: number;
  documentUrl: string | null;
};

export function isManagedResourceDocument(resource: ManagedDocumentIdentity) {
  return Boolean(
    resource.documentUrl?.includes(
      `/folders/${resource.folderId}/resources/${resource.id}/${resource.uuid}/file`,
    ),
  );
}

export async function openManagedResourceDocument(
  resource: ManagedDocumentIdentity,
) {
  const preview = window.open("about:blank", "_blank");
  try {
    const file = await resourcesApi.findDocumentFile(
      resource.folderId,
      resource.id,
      resource.uuid,
    );
    const objectUrl = URL.createObjectURL(file);
    if (preview) preview.location.href = objectUrl;
    else window.open(objectUrl, "_blank", "noopener,noreferrer");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch {
    preview?.close();
    window.alert(
      "The document could not be opened. Please retry or contact your administrator.",
    );
  }
}
