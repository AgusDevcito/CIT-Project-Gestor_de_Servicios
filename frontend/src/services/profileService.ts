import { http } from "../lib/http";
import type { PerfilDTO } from "../domain/entidades";

export const getProfileByUserId = async (userId: number): Promise<PerfilDTO> => {
  const { data } = await http.get<{ data: PerfilDTO }>(`/profile/${userId}`);
  return data.data;
};

export const updateProfile = async (
  userId: number,
  payload: { first_name: string; last_name: string; avatar_url: string },
): Promise<void> => {
  await http.put(`/profile/${userId}`, payload);
};
