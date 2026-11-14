import { apiClient } from './apiClient';
import { env } from '../config/env';
import { UserProject } from '../types';
import { INITIAL_USER_PROJECTS } from '../data/userPlugins';

export const projectService = {
  async fetchProjects(): Promise<UserProject[]> {
    if (env.isMockEnabled) {
      return INITIAL_USER_PROJECTS;
    }
    try {
      const res = await apiClient.get<{ projects?: UserProject[] }>('/api/v1/projects');
      if (res && Array.isArray(res.projects) && res.projects.length > 0) {
        return res.projects;
      }
      return INITIAL_USER_PROJECTS;
    } catch {
      return INITIAL_USER_PROJECTS;
    }
  },

  async createProject(
    project: Omit<UserProject, 'id' | 'lastSynced' | 'stars' | 'aiReviewStatus'>
  ): Promise<UserProject> {
    const fallbackItem: UserProject = {
      ...project,
      id: `proj_${Date.now()}`,
      lastSynced: Date.now(),
      stars: 1,
      aiReviewStatus: 'idle',
    };
    if (env.isMockEnabled) {
      return fallbackItem;
    }
    try {
      const res = await apiClient.post<any>('/api/v1/projects', {
        name: project.name,
        description: project.description,
      });
      return {
        ...fallbackItem,
        id: res?.id || fallbackItem.id,
      };
    } catch {
      return fallbackItem;
    }
  },

  async deleteProject(id: string): Promise<boolean> {
    if (env.isMockEnabled) {
      return true;
    }
    try {
      await apiClient.delete(`/api/v1/projects/${encodeURIComponent(id)}`);
      return true;
    } catch {
      return false;
    }
  },
};
