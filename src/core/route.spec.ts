import {PotionBase} from './potion';
import {Item} from './item';
import {Route} from './route';


describe('potion/core', () => {
	describe('Route', () => {
		class User extends Item {
			static names: any = Route.GET<string[]>('/names');
			attributes: any = Route.GET<{height: number, weight: number}>('/attributes');
		}

		beforeEach(() => {
			class Potion extends PotionBase {
				protected request(uri: string): Promise<any> {
					const {promise} = this.constructor as typeof PotionBase;

					switch (uri) {
						case '/user/1':
							return promise.resolve({data: {$uri: '/user/1'}});
						case '/user/names':
							return promise.resolve({
								data: ['John Doe'],
								headers: {}
							});
						default:
							break;
					}

					return promise.resolve({});
				}
			}

			const potion = new Potion();
			potion.register('/user', User);

		});

		it('should allow for usage as instance property', (done) => {
			User.fetch(1).then((user: User) => {
				expect(typeof user.attributes === 'function').toBe(true);
				done();
			});
		});

		it('should allow for usage as static property', () => {
			expect(typeof User.names === 'function').toBe(true);
		});

		describe('.GET()', () => {
			it('should return valid JSON', (done) => {
				User.names().then((names: any) => {
					expect(names instanceof Array).toBe(true);
					expect(names.length).toEqual(1);
					done();
				});
			});
		});
	});
});
