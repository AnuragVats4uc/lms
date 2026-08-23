import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';

import { Public } from '../auth/decorators/public.decorators';
import { Permissions } from '../auth/permissions/permissions.decorator';
import { CurrentUser } from '../auth/types/current-user.types';
import {
  CreateRegistrationPageDto,
  PublicRegistrationSubmitDto,
  UpdateRegistrationPageDto,
} from './dto/registration-page.dto';
import {
  CreateRegistrationMasterOptionDto,
  RegistrationMasterQueryDto,
  UpdateRegistrationMasterOptionDto,
} from './dto/registration-master.dto';
import { RegistrationService } from './registration.service';

type AuthenticatedRequest = Request & { user: CurrentUser };

@ApiTags('Registration')
@Controller()
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Public()
  @Get('public/registration/:slug')
  @ApiOperation({ summary: 'Get public organization registration page' })
  @ApiParam({ name: 'slug', example: 'keonjhar-library' })
  @ApiOkResponse({ description: 'Public registration configuration fetched' })
  getPublic(@Param('slug') slug: string) {
    return this.registrationService.getPublicPage(slug);
  }

  @Public()
  @Post('public/registration/:slug')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit public student registration' })
  @ApiParam({ name: 'slug', example: 'keonjhar-library' })
  @ApiBody({ type: PublicRegistrationSubmitDto })
  @ApiOkResponse({ description: 'Registration submitted successfully' })
  submitPublic(
    @Param('slug') slug: string,
    @Body() dto: PublicRegistrationSubmitDto,
  ) {
    return this.registrationService.submitPublicRegistration(slug, dto);
  }

  @Get('organizations/:organizationId/registration-pages')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.read')
  @ApiOperation({ summary: 'List organization registration pages' })
  listAdmin(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.listForOrganization(
      organizationId,
      request.user,
    );
  }

  @Post('organizations/:organizationId/registration-pages')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.update')
  @ApiCreatedResponse({ description: 'Registration page created' })
  createAdmin(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() dto: CreateRegistrationPageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.createPage(
      organizationId,
      dto,
      request.user,
    );
  }

  @Get('organizations/:organizationId/registration-pages/:pageId')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.read')
  @ApiOkResponse({ description: 'Registration page fetched' })
  getAdmin(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.getAdminPage(
      organizationId,
      pageId,
      request.user,
    );
  }

  @Patch('organizations/:organizationId/registration-pages/:pageId')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.update')
  @ApiOkResponse({ description: 'Registration page updated' })
  updateAdmin(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('pageId', ParseIntPipe) pageId: number,
    @Body() dto: UpdateRegistrationPageDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.updatePage(
      organizationId,
      pageId,
      dto,
      request.user,
    );
  }

  @Get('organizations/:organizationId/education-options')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.read')
  listEducationOptions(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Query() query: RegistrationMasterQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.listEducationOptions(
      organizationId,
      query,
      request.user,
    );
  }

  @Post('organizations/:organizationId/education-options')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.update')
  createEducationOption(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() dto: CreateRegistrationMasterOptionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.createEducationOption(
      organizationId,
      dto,
      request.user,
    );
  }

  @Patch('organizations/:organizationId/education-options/:optionId')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.update')
  updateEducationOption(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('optionId', ParseIntPipe) optionId: number,
    @Body() dto: UpdateRegistrationMasterOptionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.updateEducationOption(
      organizationId,
      optionId,
      dto,
      request.user,
    );
  }

  @Delete('organizations/:organizationId/education-options/:optionId')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.update')
  @HttpCode(HttpStatus.OK)
  deleteEducationOption(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('optionId', ParseIntPipe) optionId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.deactivateEducationOption(
      organizationId,
      optionId,
      request.user,
    );
  }

  @Get('organizations/:organizationId/digital-library-locations')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.read')
  listDigitalLibraryLocations(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Query() query: RegistrationMasterQueryDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.listDigitalLibraryLocations(
      organizationId,
      query,
      request.user,
    );
  }

  @Post('organizations/:organizationId/digital-library-locations')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.update')
  createDigitalLibraryLocation(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Body() dto: CreateRegistrationMasterOptionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.createDigitalLibraryLocation(
      organizationId,
      dto,
      request.user,
    );
  }

  @Patch('organizations/:organizationId/digital-library-locations/:locationId')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.update')
  updateDigitalLibraryLocation(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('locationId', ParseIntPipe) locationId: number,
    @Body() dto: UpdateRegistrationMasterOptionDto,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.updateDigitalLibraryLocation(
      organizationId,
      locationId,
      dto,
      request.user,
    );
  }

  @Delete('organizations/:organizationId/digital-library-locations/:locationId')
  @ApiBearerAuth('access-token')
  @Permissions('organizations.update')
  @HttpCode(HttpStatus.OK)
  deleteDigitalLibraryLocation(
    @Param('organizationId', ParseIntPipe) organizationId: number,
    @Param('locationId', ParseIntPipe) locationId: number,
    @Req() request: AuthenticatedRequest,
  ) {
    return this.registrationService.deactivateDigitalLibraryLocation(
      organizationId,
      locationId,
      request.user,
    );
  }
}
