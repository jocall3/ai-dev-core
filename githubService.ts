import { getOctokit } from './authService.ts';
import type { Repo, FileNode } from './types.ts';
import { logEvent, logError, measurePerformance } from './services/index.ts';

// --- Repository-Level Functions ---

/**
 * Fetches the repositories for the authenticated user.
 * @returns A promise that resolves to an array of Repo objects.
 */
export const getRepos = async (): Promise<Repo[]> => {
    return measurePerformance('getRepos', async () => {
        logEvent('getRepos_start');
        try {
            const octokit = getOctokit();
            const { data } = await octokit.request('GET /user/repos', {
                type: 'owner',
                sort: 'updated',
                per_page: 100,
            });
            logEvent('getRepos_success', { count: data.length });
            return data as Repo[];
        } catch (error) {
            logError(error as Error, { context: 'getRepos' });
            throw new Error(`Failed to fetch repositories: ${(error as Error).message}`);
        }
    });
};

/**
 * Deletes a repository. This is a destructive action.
 * @param owner The repository owner's login.
 * @param repo The repository name.
 * @returns A promise that resolves when the deletion is complete.
 */
export const deleteRepo = async (owner: string, repo: string): Promise<void> => {
     return measurePerformance('deleteRepo', async () => {
        logEvent('deleteRepo_start', { owner, repo });
        try {
            const octokit = getOctokit();
            await octokit.request('DELETE /repos/{owner}/{repo}', {
                owner,
                repo,
            });
            logEvent('deleteRepo_success', { owner, repo });
        } catch (error) {
            logError(error as Error, { context: 'deleteRepo', owner, repo });
            throw new Error(`Failed to delete repository: ${(error as Error).message}`);
        }
    });
};

// --- File and Tree Functions ---

/**
 * Fetches the file tree for a repository recursively.
 * @param owner The repository owner's login.
 * @param repo The repository name.
 * @returns A promise that resolves to the root FileNode of the repository.
 */
export const getRepoTree = async (owner: string, repo: string): Promise<FileNode> => {
     return measurePerformance('getRepoTree', async () => {
        logEvent('getRepoTree_start', { owner, repo });
        try {
            const octokit = getOctokit();
            const { data: branch } = await octokit.request('GET /repos/{owner}/{repo}/branches/{branch}', {
                owner,
                repo,
                branch: 'main', // or default branch
            });
            const treeSha = branch.commit.sha;
            
            const { data: treeData } = await octokit.request('GET /repos/{owner}/{repo}/git/trees/{tree_sha}', {
                owner,
                repo,
                tree_sha: treeSha,
                recursive: 'true',
            });

            const root: FileNode = { name: repo, type: 'folder', path: '', children: [] };
            
            treeData.tree.forEach((item: any) => {
                const pathParts = item.path.split('/');
                let currentNode = root;

                pathParts.forEach((part, index) => {
                    if (!currentNode.children) {
                        currentNode.children = [];
                    }
                    let childNode = currentNode.children.find(child => child.name === part);

                    if (!childNode) {
                        childNode = {
                            name: part,
                            path: item.path,
                            type: item.type === 'tree' ? 'folder' : 'file',
                        };
                        if(item.type === 'tree') childNode.children = [];
                        currentNode.children.push(childNode);
                    }
                    currentNode = childNode;
                });
            });

            logEvent('getRepoTree_success', { owner, repo, items: treeData.tree.length });
            return root;
        } catch (error) {
            logError(error as Error, { context: 'getRepoTree', owner, repo });
            throw new Error(`Failed to fetch repository tree: ${(error as Error).message}`);
        }
    });
};

/**
 * Fetches the content of a specific file from a repository.
 * @param owner The repository owner's login.
 * @param repo The repository name.
 * @param path The full path to the file within the repository.
 * @returns A promise that resolves to the string content of the file.
 */
export const getFileContent = async (owner: string, repo: string, path: string): Promise<string> => {
    return measurePerformance('getFileContent', async () => {
        logEvent('getFileContent_start', { owner, repo, path });
        try {
            const octokit = getOctokit();
            const { data } = await octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
                owner,
                repo,
                path,
            });

            if (Array.isArray(data) || data.type !== 'file' || !data.content) {
                 throw new Error("Path did not point to a valid file.");
            }

            // The content is Base64 encoded, so we need to decode it.
            const content = atob(data.content);
            logEvent('getFileContent_success', { owner, repo, path });
            return content;
        } catch (error) {
             logError(error as Error, { context: 'getFileContent', owner, repo, path });
             throw new Error(`Failed to fetch file content: ${(error as Error).message}`);
        }
    });
};

// --- Commit and Branching Functions ---

/**
 * Commits one or more files to a repository in a single commit.
 * This is a multi-step process:
 * 1. Get the latest commit SHA of the branch.
 * 2. Get the base tree SHA from that commit.
 * 3. Create new blob(s) for the file content.
 * 4. Create a new tree with the new blob(s).
 * 5. Create a new commit pointing to the new tree.
 * 6. Update the branch reference to point to the new commit.
 * @param owner The repository owner's login.
 * @param repo The repository name.
 * @param files An array of file objects with filePath and content.
 * @param message The commit message.
 * @param branch The branch to commit to (defaults to 'main').
 * @returns A promise that resolves with the URL of the new commit.
 */
export const commitFiles = async (
    owner: string,
    repo: string,
    files: { filePath: string; content: string }[],
    message: string,
    branch: string = 'main'
): Promise<string> => {
    return measurePerformance('commitFiles', async () => {
        logEvent('commitFiles_start', { owner, repo, fileCount: files.length, branch });
        const octokit = getOctokit();

        try {
            // 1. Get the latest commit SHA and base tree SHA
            const { data: refData } = await octokit.request('GET /repos/{owner}/{repo}/git/ref/{ref}', {
                owner,
                repo,
                ref: `heads/${branch}`,
            });
            const latestCommitSha = refData.object.sha;
            const { data: commitData } = await octokit.request('GET /repos/{owner}/{repo}/git/commits/{commit_sha}', {
                owner,
                repo,
                commit_sha: latestCommitSha,
            });
            const baseTreeSha = commitData.tree.sha;

            // 2. Create blobs for all new file contents
            const blobPromises = files.map(file =>
                octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
                    owner,
                    repo,
                    content: file.content,
                    encoding: 'utf-8',
                })
            );
            const blobs = await Promise.all(blobPromises);
            
            // 3. Create the tree object
            const tree = blobs.map((blob, index) => ({
                path: files[index].filePath,
                mode: '100644' as const, // file mode
                type: 'blob' as const,
                sha: blob.data.sha,
            }));

            // 4. Create a new tree
            const { data: newTree } = await octokit.request('POST /repos/{owner}/{repo}/git/trees', {
                owner,
                repo,
                base_tree: baseTreeSha,
                tree,
            });

            // 5. Create a new commit
            const { data: newCommit } = await octokit.request('POST /repos/{owner}/{repo}/git/commits', {
                owner,
                repo,
                message,
                tree: newTree.sha,
                parents: [latestCommitSha],
            });

            // 6. Update the branch reference (fast-forward)
            await octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
                owner,
                repo,
                ref: `heads/${branch}`,
                sha: newCommit.sha,
            });

            logEvent('commitFiles_success', { commitUrl: newCommit.html_url });
            return newCommit.html_url;

        } catch (error) {
            logError(error as Error, { context: 'commitFiles', owner, repo, branch });
            throw new Error(`Failed to commit files: ${(error as Error).message}`);
        }
    });
};