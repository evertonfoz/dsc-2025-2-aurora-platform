declare module '@nestjs/typeorm' {
  export const TypeOrmModule: any;
  export function InjectRepository(...args: any[]): any;
}

declare module '@nestjs/jwt' {
  export const JwtModule: any;
  export class JwtService {
    [k: string]: any;
  }
}

declare module '@nestjs/passport' {
  export const AuthGuard: any;
  export const PassportModule: any;
  export function PassportStrategy(...args: any[]): any;
}

declare module '@nestjs/config' {
  export class ConfigService {
    get<T = any>(key: string, defaultValue?: any): T;
    [k: string]: any;
  }
}

declare module '@nestjs/swagger' {
  export const ApiBearerAuth: any;
  export const ApiTags: any;
  export const ApiProperty: any;
  export const ApiPropertyOptional: any;
  export const ApiResponse: any;
  export const ApiOperation: any;
  export const PartialType: any;
  export const SwaggerModule: any;
  export const DocumentBuilder: any;
}

declare module 'yaml' {
  const YAML: any;
  export default YAML;
}
