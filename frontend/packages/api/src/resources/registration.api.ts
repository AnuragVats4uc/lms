import type {
  AdminRegistrationPage,
  AdminRegistrationPageList,
  ApiResponse,
  CreateRegistrationPageRequest,
  CreateRegistrationMasterOptionRequest,
  PublicRegistrationPage,
  PublicRegistrationSubmitRequest,
  PublicRegistrationSubmitResponse,
  RegistrationMasterOption,
  RegistrationMasterOptionList,
  RegistrationMasterOptionQuery,
  UpdateRegistrationPageRequest,
  UpdateRegistrationMasterOptionRequest,
} from "@repo/types";

import { api } from "../client/axios";
import { unwrapApiData } from "../client/response";

function adminEndpoint(organizationId: number) {
  return `/organizations/${organizationId}/registration-pages`;
}

export const registrationApi = {
  getPublic(slug: string) {
    return api
      .get<ApiResponse<PublicRegistrationPage>>(`/public/registration/${slug}`)
      .then(unwrapApiData);
  },

  submitPublic(slug: string, payload: PublicRegistrationSubmitRequest) {
    return api
      .post<ApiResponse<PublicRegistrationSubmitResponse>>(
        `/public/registration/${slug}`,
        payload,
      )
      .then(unwrapApiData);
  },

  listAdmin(organizationId: number) {
    return api
      .get<ApiResponse<AdminRegistrationPageList>>(
        adminEndpoint(organizationId),
      )
      .then(unwrapApiData);
  },

  createAdmin(organizationId: number, payload: CreateRegistrationPageRequest) {
    return api
      .post<ApiResponse<AdminRegistrationPage>>(
        adminEndpoint(organizationId),
        payload,
      )
      .then(unwrapApiData);
  },

  updateAdmin(
    organizationId: number,
    pageId: number,
    payload: UpdateRegistrationPageRequest,
  ) {
    return api
      .patch<ApiResponse<AdminRegistrationPage>>(
        `${adminEndpoint(organizationId)}/${pageId}`,
        payload,
      )
      .then(unwrapApiData);
  },

  listEducationOptions(
    organizationId: number,
    query?: RegistrationMasterOptionQuery,
  ) {
    return api
      .get<ApiResponse<RegistrationMasterOptionList>>(
        `/organizations/${organizationId}/education-options`,
        { params: query },
      )
      .then(unwrapApiData);
  },

  createEducationOption(
    organizationId: number,
    payload: CreateRegistrationMasterOptionRequest,
  ) {
    return api
      .post<ApiResponse<RegistrationMasterOption>>(
        `/organizations/${organizationId}/education-options`,
        payload,
      )
      .then(unwrapApiData);
  },

  updateEducationOption(
    organizationId: number,
    optionId: number,
    payload: UpdateRegistrationMasterOptionRequest,
  ) {
    return api
      .patch<ApiResponse<RegistrationMasterOption>>(
        `/organizations/${organizationId}/education-options/${optionId}`,
        payload,
      )
      .then(unwrapApiData);
  },

  removeEducationOption(organizationId: number, optionId: number) {
    return api
      .delete<ApiResponse<RegistrationMasterOption>>(
        `/organizations/${organizationId}/education-options/${optionId}`,
      )
      .then(unwrapApiData);
  },

  listDigitalLibraryLocations(
    organizationId: number,
    query?: RegistrationMasterOptionQuery,
  ) {
    return api
      .get<ApiResponse<RegistrationMasterOptionList>>(
        `/organizations/${organizationId}/digital-library-locations`,
        { params: query },
      )
      .then(unwrapApiData);
  },

  createDigitalLibraryLocation(
    organizationId: number,
    payload: CreateRegistrationMasterOptionRequest,
  ) {
    return api
      .post<ApiResponse<RegistrationMasterOption>>(
        `/organizations/${organizationId}/digital-library-locations`,
        payload,
      )
      .then(unwrapApiData);
  },

  updateDigitalLibraryLocation(
    organizationId: number,
    locationId: number,
    payload: UpdateRegistrationMasterOptionRequest,
  ) {
    return api
      .patch<ApiResponse<RegistrationMasterOption>>(
        `/organizations/${organizationId}/digital-library-locations/${locationId}`,
        payload,
      )
      .then(unwrapApiData);
  },

  removeDigitalLibraryLocation(organizationId: number, locationId: number) {
    return api
      .delete<ApiResponse<RegistrationMasterOption>>(
        `/organizations/${organizationId}/digital-library-locations/${locationId}`,
      )
      .then(unwrapApiData);
  },
};
