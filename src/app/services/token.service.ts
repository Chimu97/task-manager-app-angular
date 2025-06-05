import { Inject, Injectable, InjectionToken } from '@angular/core';
import { DecodedAuthToken } from 'src/app/models';

export type TokenDecoderFn = <TResult = unknown, TOptions = unknown>(
  token: string,
  options?: TOptions
) => TResult;

export const TOKEN_DECODER_FN = new InjectionToken<TokenDecoderFn>('TOKEN_DECODER_FN');

@Injectable({
  providedIn: 'root',
})
export class TokenService {
  private _authToken: string | null = null;

  get authToken(): string | null {
    return this._authToken;
  }

  constructor(@Inject(TOKEN_DECODER_FN) private decoderFn: TokenDecoderFn) {}

  decode(token: string, saveToken = true): DecodedAuthToken | null | never {
    if (saveToken) this._authToken = token;

    return token != null ? this.decoderFn(token) : null;
  }

  getUserId(): number {
  if (!this._authToken) return 0;

  const decoded: any = this.decoderFn(this._authToken);
  return decoded?.UserId ? +decoded.UserId : 0;
}

getRoles(): string[] {
  if (!this._authToken) return [];

  const decoded: any = this.decoderFn(this._authToken);
  const raw = decoded?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'];

  if (!raw) return [];

  return typeof raw === 'string' ? [raw] : raw;
}

}
