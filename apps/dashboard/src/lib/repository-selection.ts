import {
  getRepositories,
  type Repository,
} from "@/lib/repropulse-api";

export type RepositorySearchParams = Promise<{
  repository?: string;
}>;

export async function getRepositorySelection(
  searchParams: RepositorySearchParams
): Promise<{
  repositories: Repository[];
  selectedRepository: Repository;
}> {
  const [repositories, params] = await Promise.all([
    getRepositories(),
    searchParams,
  ]);

  if (repositories.length === 0) {
    throw new Error("No repositories have been ingested yet.");
  }

  const requestedId = Number(params.repository);

  const selectedRepository =
    repositories.find((repository) => repository.id === requestedId) ??
    repositories[0]!;

  return { repositories, selectedRepository };
}

export function repositoryHref(path: string, repositoryId: number) {
  return `${path}?repository=${repositoryId}`;
}
