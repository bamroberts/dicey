/** Accept codes or the original Supabase email link without following its redirect. */
export function parseEmailProof(
  input: string,
  projectUrl: string,
): { token: string } | { token_hash: string } {
  const value = input.trim();
  if (/^\d{6,10}$/.test(value)) return { token: value };
  try {
    const url = new URL(value);
    const project = new URL(projectUrl);
    if (
      url.origin !== project.origin ||
      url.pathname !== "/auth/v1/verify" ||
      !["magiclink", "signup", "email"].includes(
        url.searchParams.get("type") ?? "",
      )
    )
      throw new Error("Invalid sign-in link");
    const token =
      url.searchParams.get("token") ?? url.searchParams.get("token_hash");
    if (!token || token.length < 16 || token.length > 512)
      throw new Error("Invalid sign-in link");
    return { token_hash: token };
  } catch {
    throw new Error(
      "Paste the code or full sign-in link from your email. The link must be for this app’s sign-in service.",
    );
  }
}
