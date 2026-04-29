import type { GitLabCreateIssueInProjectResponseDto } from "@/lib/gitlab-create-issue-in-project-api-response-dto-types";

export async function clientFetchGitlabCreateIssueInProjectApi(input: {
  title: string;
  description?: string;
}): Promise<GitLabCreateIssueInProjectResponseDto> {
  const response = await fetch("/api/gitlab/issues/create-in-project", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      title: input.title,
      ...(input.description?.trim() ? { description: input.description.trim() } : {}),
    }),
  });

  return (await response.json()) as GitLabCreateIssueInProjectResponseDto;
}
