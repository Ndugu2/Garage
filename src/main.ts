import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import './style.css'

type Service = 'Tyre change' | 'Battery' | 'Towing' | 'Engine' | 'Electrical' | 'Overheating'
type ServiceFilter = 'All services' | Service
type Screen = 'home' | 'driver' | 'mechanic' | 'admin' | 'login' | 'register'
type AccountRole = 'driver' | 'mechanic'
type ServiceMode = 'mobile' | 'garage'
type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'completed'

interface Account {
  id: number
  email: string
  name: string
  profile: { role: AccountRole }
  provider_profile: { id: number; is_verified: boolean } | null
}

interface Mechanic {
  id: number | string
  name: string
  area: string
  lat: number
  lng: number
  rating: number
  reviews: number
  eta: string
  available: boolean
  services: Service[]
  serviceMode: ServiceMode
  isDemo: boolean
  isVerified: boolean
  distance?: number
}

interface AssistanceRequest {
  id: number
  mechanic: number
  mechanicName: string
  driverName: string
  issue: string
  notes: string
  latitude: number
  longitude: number
  serviceMode: ServiceMode
  status: RequestStatus
  createdAt: string
  hasReview: boolean
}

interface RequestMessage {
  id: number
  sender: number
  senderName: string
  message: string
  createdAt: string
}

interface ProviderReview {
  id: number
  driverName: string
  rating: number
  comment: string
  createdAt: string
}

interface MechanicProfile {
  id: number
  name: string
  area: string
  latitude: number
  longitude: number
  service_mode: ServiceMode
  phone: string
  services: Service[]
  eta: string
  is_available: boolean
  is_verified: boolean
  is_demo: boolean
  rating: number
  review_count: number
}

const demoMechanics: Mechanic[] = [
  {
    id: 'ntinda',
    name: 'City Roadside Crew',
    area: 'Ntinda',
    lat: 0.3574,
    lng: 32.6131,
    rating: 4.8,
    reviews: 32,
    eta: 'About 20 min',
    available: true,
    services: ['Tyre change', 'Battery', 'Engine', 'Electrical'],
    serviceMode: 'mobile',
    isDemo: true,
    isVerified: false,
  },
  {
    id: 'bugolobi',
    name: 'Kampala Mobile Assist',
    area: 'Bugolobi',
    lat: 0.3126,
    lng: 32.6251,
    rating: 4.7,
    reviews: 24,
    eta: 'About 25 min',
    available: true,
    services: ['Battery', 'Towing', 'Engine', 'Electrical'],
    serviceMode: 'garage',
    isDemo: true,
    isVerified: false,
  },
  {
    id: 'makerere',
    name: 'Roadside Support Kampala',
    area: 'Wandegeya',
    lat: 0.3355,
    lng: 32.5681,
    rating: 4.6,
    reviews: 18,
    eta: 'About 30 min',
    available: false,
    services: ['Tyre change', 'Towing', 'Engine'],
    serviceMode: 'mobile',
    isDemo: true,
    isVerified: false,
  },
  {
    id: 'najjanankumbi',
    name: 'Quick Response Garage',
    area: 'Najjanankumbi',
    lat: 0.2842,
    lng: 32.5723,
    rating: 4.5,
    reviews: 15,
    eta: 'About 35 min',
    available: true,
    services: ['Tyre change', 'Battery', 'Towing'],
    serviceMode: 'garage',
    isDemo: true,
    isVerified: false,
  },
]

const issueOptions: Service[] = ['Tyre change', 'Battery', 'Towing', 'Engine', 'Electrical', 'Overheating']
const problemOptions = [...issueOptions, 'Other'] as const
const serviceSet: ReadonlySet<string> = new Set(issueOptions)
const manualAreas = [
  { id: 'central', label: 'Central Kampala', lat: 0.3136, lng: 32.5811 },
  { id: 'ntinda', label: 'Ntinda', lat: 0.3574, lng: 32.6131 },
  { id: 'bugolobi', label: 'Bugolobi', lat: 0.3126, lng: 32.6251 },
  { id: 'wandegeya', label: 'Wandegeya', lat: 0.3355, lng: 32.5681 },
  { id: 'najjanankumbi', label: 'Najjanankumbi', lat: 0.2842, lng: 32.5723 },
]
const app = document.querySelector<HTMLDivElement>('#app')

if (!app) {
  throw new Error('App root element #app was not found.')
}

let currentScreen: Screen = 'home'
let postAuthScreen: Screen = 'home'
let currentAccount: Account | null = null
let csrfToken = ''
let authStateVersion = 0
let currentLocation = { lat: 0.3136, lng: 32.5811 }
let locationLabel = 'Kampala, Uganda · approximate demo location'
let locationIsLive = false
let selectedManualAreaId = 'central'
let selectedService: ServiceFilter = 'All services'
let searchRadius = 20
let onlyAvailable = false
let selectedMechanicId: number | string = ''
let map: L.Map | null = null
let liveMechanics: Mechanic[] = []
let mechanicsLoaded = false
let mechanicsLoading = false
let mechanicsError = ''
let assistanceRequests: AssistanceRequest[] = []
let requestsLoaded = false
let requestsLoading = false
let requestsError = ''
let mechanicProfile: MechanicProfile | null = null
let mechanicProfileLoaded = false
let workspaceLoading = false
let workspaceError = ''
let selectedRequestId: number | null = null
let selectedReviewRequestId: number | null = null

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
    }
    return entities[character] ?? character
  })

function distanceKm(from: { lat: number; lng: number }, to: { lat: number; lng: number }): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180
  const earthRadiusKm = 6371
  const latitudeDelta = radians(to.lat - from.lat)
  const longitudeDelta = radians(to.lng - from.lng)
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(from.lat)) *
      Math.cos(radians(to.lat)) *
      Math.sin(longitudeDelta / 2) ** 2

  const boundedHaversine = Math.min(1, Math.max(0, haversine))
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(boundedHaversine), Math.sqrt(1 - boundedHaversine))
}

function getVisibleMechanics(): Array<Mechanic & { distance: number }> {
  return [...demoMechanics, ...liveMechanics]
    .filter((mechanic) => selectedService === 'All services' || mechanic.services.includes(selectedService))
    .filter((mechanic) => !onlyAvailable || mechanic.available)
    .map((mechanic) => ({ ...mechanic, distance: distanceKm(currentLocation, mechanic) }))
    .filter((mechanic) => mechanic.distance <= searchRadius)
    .sort((first, second) => first.distance - second.distance)
}

function servicePills(services: Service[]): string {
  return services
    .map((service) => `<span class="service-pill">${escapeHtml(service)}</span>`)
    .join('')
}

function mechanicCards(): string {
  const mechanics = getVisibleMechanics()
  if (mechanics.length === 0) {
    return '<div class="empty-state">No sample providers match those filters. Try a wider radius or a different service.</div>'
  }

  return mechanics
    .map(
      (mechanic) => `
        <article class="mechanic-card ${selectedMechanicId === mechanic.id ? 'is-selected' : ''}" data-mechanic-card="${mechanic.id}">
          <div class="mechanic-card-top">
            <div class="provider-avatar">${mechanic.name.split(' ').map((word) => word[0]).slice(0, 2).join('')}</div>
            <div class="provider-heading">
              <div class="provider-title-row">
                <h3>${escapeHtml(mechanic.name)}</h3>
                <span class="${mechanic.isDemo ? 'demo-tag' : 'verified-tag'}">${mechanic.isDemo ? 'SAMPLE' : 'VERIFIED'}</span>
              </div>
              <p>${escapeHtml(mechanic.area)} <span class="dot-separator">·</span> ${mechanic.distance.toFixed(1)} km away</p>
            </div>
            <span class="rating"><span aria-hidden="true">★</span> ${mechanic.rating.toFixed(1)}</span>
          </div>
          <div class="provider-meta"><span class="availability-tag ${mechanic.available ? '' : 'is-closed'}"><span></span> ${mechanic.available ? 'Available' : 'Unavailable'}</span><span>${mechanic.serviceMode === 'mobile' ? 'Travels to you' : 'Visit garage'}</span></div>
          <div class="provider-services">${servicePills(mechanic.services)}</div>
          <div class="provider-footer">
            <span class="arrival">${mechanic.distance.toFixed(1)} km <span class="muted">· ${mechanic.reviews ? `${mechanic.reviews} reviews` : 'New provider'}</span></span>
            <div class="provider-actions">
              ${mechanic.reviews > 0 ? `<button class="profile-button" type="button" data-provider-reviews="${mechanic.id}">Reviews</button>` : ''}
              ${mechanic.isDemo
                ? '<span class="sample-action-note">Sample only</span>'
                : `<button class="request-button" type="button" data-request="${mechanic.id}">Request help <span aria-hidden="true">↗</span></button>`}
            </div>
          </div>
          ${mechanic.isDemo ? '<p class="demo-disclaimer">Illustrative profile — cannot receive real requests.</p>' : ''}
        </article>
      `,
    )
    .join('')
}

function homeScreen(): string {
  return `
    <main class="home-page">
      <section class="home-hero">
        <div class="home-hero-copy">
          <span class="home-eyebrow"><span></span> ROADSIDE HELP, MADE SIMPLE</span>
          <h1>When the road<br />gets tough, <span>we’re nearby.</span></h1>
          <p>Find roadside support around Kampala, compare services on a map, and choose the next step that works for you.</p>
          <div class="home-actions">
            <button class="home-primary-button" type="button" data-screen="driver">Find a mechanic <span aria-hidden="true">→</span></button>
            <a href="#how-it-works">How it works</a>
          </div>
          <div class="home-hero-note"><span aria-hidden="true">i</span> Sample listings only. This preview does not contact a mechanic.</div>
        </div>
        <div class="home-visual" aria-label="Illustration of roadside vehicle assistance">
          <div class="visual-grid"></div>
          <div class="visual-route route-one"></div>
          <div class="visual-route route-two"></div>
          <div class="visual-pin pin-one"><span>1</span></div>
          <div class="visual-pin pin-two"><span>2</span></div>
          <div class="visual-pin pin-three"><span>3</span></div>
          <div class="visual-location"><span></span> KAMPALA, UGANDA</div>
          <div class="roadside-card">
            <div class="roadside-card-icon" aria-hidden="true">⌁</div>
            <div><strong>Help is closer than you think</strong><span>Explore the demo map</span></div>
            <span class="roadside-card-arrow" aria-hidden="true">↗</span>
          </div>
          <div class="visual-caption">A clearer way forward.</div>
        </div>
      </section>
      <section class="home-benefits" aria-label="Makanika Connect benefits">
        <article><span class="benefit-icon" aria-hidden="true">⌖</span><div><h2>Nearby mechanics</h2><p>Explore illustrative providers by area on a map.</p></div></article>
        <article><span class="benefit-icon" aria-hidden="true">✓</span><div><h2>Clear information</h2><p>Compare sample services and availability in one place.</p></div></article>
        <article><span class="benefit-icon" aria-hidden="true">↗</span><div><h2>Simple requests</h2><p>Try the request flow; it stays in this browser demo.</p></div></article>
      </section>
      <section class="home-how" id="how-it-works">
        <div class="home-how-heading">
          <span class="eyebrow">A LITTLE HELP, ONE STEP AT A TIME</span>
          <h2>Get oriented. Find options.<br /><span>Make your next move.</span></h2>
        </div>
        <div class="home-steps">
          <article><span>01</span><h3>Choose your area</h3><p>Use an approximate Kampala area, or choose to share your device location.</p></article>
          <article><span>02</span><h3>Explore nearby options</h3><p>Filter the illustrative listings by service, distance, and availability.</p></article>
          <article><span>03</span><h3>Preview a request</h3><p>See how a request works. Nothing is sent to a real provider.</p></article>
        </div>
        <button class="home-secondary-button" type="button" data-screen="driver">Explore the mechanic finder <span aria-hidden="true">→</span></button>
      </section>
    </main>
  `
}

function driverRequestCards(): string {
  if (requestsError) return `<p class="form-error">${escapeHtml(requestsError)}</p>`
  if (requestsLoading) return '<div class="empty-state">Loading your assistance requests…</div>'
  if (assistanceRequests.length === 0) {
    return '<div class="empty-state">Your requests and status updates will appear here.</div>'
  }
  return assistanceRequests
    .map(
      (request) => `
        <article class="request-row">
          <div class="request-row-icon">${escapeHtml(request.issue.slice(0, 1))}</div>
          <div class="request-row-content">
            <span class="status-pill status-${request.status}">${escapeHtml(request.status)}</span>
            <h3>${escapeHtml(request.mechanicName)}</h3>
            <p>${escapeHtml(request.issue)} · ${request.serviceMode === 'mobile' ? 'Travels to you' : 'Garage visit'}</p>
            ${request.notes ? `<p>${escapeHtml(request.notes)}</p>` : ''}
          </div>
          <div class="request-row-actions">
            ${request.status !== 'rejected' ? `<button class="quiet-button" type="button" data-messages="${request.id}">Messages</button>` : ''}
            ${request.status === 'completed' && !request.hasReview ? `<button class="quiet-button" type="button" data-review="${request.id}">Rate service</button>` : ''}
            ${request.hasReview ? '<span class="review-state">Reviewed</span>' : ''}
          </div>
        </article>
      `,
    )
    .join('')
}

function authScreen(register: boolean): string {
  return `
    <main class="auth-page">
      <section class="auth-card">
        <button class="auth-back" type="button" data-screen="home">← Back to home</button>
        <div class="auth-brand-mark" aria-hidden="true">✳</div>
        <span class="eyebrow">${register ? 'JOIN MAKANIKA CONNECT' : 'WELCOME BACK'}</span>
        <h1>${register ? 'Create your account' : 'Welcome back'}</h1>
        <p class="auth-intro">${register ? 'Create a driver or mechanic account.' : 'Sign in to your Makanika Connect account.'}</p>
        <form class="auth-form" data-auth-form data-register="${register}">
          ${register ? `
            <label for="auth-name">Full name</label>
            <input id="auth-name" name="name" autocomplete="name" maxlength="150" placeholder="Enter your full name" required />
            <label for="auth-role">Account type</label>
            <select id="auth-role" name="role" required><option value="driver">Driver</option><option value="mechanic">Mechanic</option></select>
          ` : ''}
          <label for="auth-email">Email address</label>
          <input id="auth-email" name="email" type="email" autocomplete="email" maxlength="254" placeholder="you@example.com" required />
          <label for="auth-password">Password</label>
          <input id="auth-password" name="password" type="password" autocomplete="${register ? 'new-password' : 'current-password'}" minlength="8" placeholder="${register ? 'At least 8 characters' : 'Enter your password'}" required />
          <button class="auth-submit" type="submit">${register ? 'Create account' : 'Sign in'}</button>
          <p class="auth-status" role="status" aria-live="polite"></p>
        </form>
        <p class="auth-switch">${register ? 'Already registered?' : 'New to Makanika Connect?'} <button type="button" data-screen="${register ? 'login' : 'register'}">${register ? 'Sign in' : 'Create account'}</button></p>
        <p class="auth-disclaimer">Your account is stored securely by this app’s Django backend. Passwords are never stored as plain text.</p>
      </section>
      <aside class="auth-aside"><span class="auth-aside-icon">⌖</span><h2>Better journeys<br />start with a little help.</h2><p>One account to access roadside assistance tools around Kampala.</p></aside>
    </main>
  `
}

function driverScreen(): string {
  const filters: ServiceFilter[] = ['All services', ...issueOptions]
  return `
    <section class="workspace driver-workspace">
      <aside class="filters-panel">
        <div class="section-heading">
          <div class="eyebrow">ROADSIDE ASSISTANCE</div>
          <h1>Find a mechanic</h1>
          <p class="section-subtitle">Mobile help near your location.</p>
        </div>
        <div class="location-card">
          <div class="location-icon" aria-hidden="true">⌖</div>
          <div class="location-copy">
            <span class="field-label">YOUR LOCATION</span>
            <strong>${escapeHtml(locationLabel)}</strong>
            <span class="location-status">${locationIsLive ? 'Using your device location' : 'Using an approximate starting point'}</span>
          </div>
        </div>
        <button id="locate-button" class="location-button" type="button"><span aria-hidden="true">⌖</span> Use my current location</button>
        <div class="manual-location">
          <label for="manual-area">Choose a nearby area</label>
          <select id="manual-area" aria-label="Choose a nearby Kampala area">
            <option value="" ${selectedManualAreaId ? '' : 'selected'} disabled>Choose a Kampala area</option>
            ${manualAreas
              .map(
                (area) =>
                  `<option value="${area.id}" ${selectedManualAreaId === area.id ? 'selected' : ''}>${escapeHtml(area.label)}</option>`,
              )
              .join('')}
          </select>
        </div>
        <div class="filter-section">
          <div class="filter-section-heading"><h2>Service type</h2><button id="clear-filters" type="button">Clear</button></div>
          <div class="filter-row" aria-label="Filter by service">
            ${filters
              .map(
                (filter) => `
                  <button class="filter-chip ${selectedService === filter ? 'active' : ''}" data-filter="${escapeHtml(filter)}" type="button" aria-pressed="${selectedService === filter}">
                    ${escapeHtml(filter)}
                  </button>
                `,
              )
              .join('')}
          </div>
        </div>
        <div class="filter-section radius-section">
          <div class="filter-section-heading"><h2>Distance range</h2><span><strong>${searchRadius}</strong> km</span></div>
          <input id="radius-filter" type="range" min="2" max="30" step="1" value="${searchRadius}" aria-label="Maximum search distance in kilometres" />
          <div class="range-labels"><span>2 km</span><span>30 km</span></div>
        </div>
        <label class="availability-filter"><input id="availability-filter" type="checkbox" ${onlyAvailable ? 'checked' : ''} /><span>Available now</span></label>
        <p class="list-note">Only admin-verified providers can receive real requests. Sample entries are for layout preview only.</p>
      </aside>
      <section class="map-panel">
        <div class="map-heading">
          <div>
            <span class="field-label">KAMPALA, UGANDA</span>
            <h2>Mechanics near you</h2>
          </div>
          <span class="map-legend"><span></span> Verified and sample listings</span>
        </div>
        <div id="map" class="map" role="application" aria-label="Map showing your location and demo mechanic locations"></div>
        <div class="safety-note">
          <span class="safety-icon" aria-hidden="true">i</span>
          <p><strong>Safety first.</strong> If your vehicle is in a dangerous position, move to a safe place and contact local emergency services. Do not drive a vehicle you believe is unsafe.</p>
        </div>
      </section>
      <aside class="providers-panel">
        <div class="results-heading">
          <div>
            <h2>Nearby mechanics</h2>
            <p>Sorted by distance</p>
          </div>
          <span class="results-count">${getVisibleMechanics().length} found</span>
        </div>
        ${mechanicsError ? `<p class="form-error">${escapeHtml(mechanicsError)}</p>` : ''}
        ${mechanicsLoading ? '<p class="list-note">Loading verified providers…</p>' : ''}
        <div class="mechanic-list">${mechanicCards()}</div>
        <p class="providers-disclaimer">Provider profiles are reviewed before appearing in search. Sample profiles cannot receive requests.</p>
      </aside>
      <section class="my-requests-panel">
        <div class="results-heading"><div><h2>My assistance requests</h2><p>Follow responses from your selected mechanic.</p></div></div>
        ${currentAccount?.profile.role === 'driver'
          ? driverRequestCards()
          : '<div class="empty-state">Sign in with a driver account to submit and track assistance requests.</div>'}
      </section>
    </section>
    <dialog id="request-dialog" class="request-dialog">
      <form id="request-form" method="dialog">
        <button class="dialog-close" type="button" aria-label="Close">×</button>
        <div class="eyebrow">ROADSIDE REQUEST</div>
        <h2>Request roadside assistance</h2>
        <p class="dialog-intro" id="request-mode-note">Your request will go to the verified provider you selected.</p>
        <label class="form-label" for="issue-select">What do you need?</label>
        <select id="issue-select" name="issue" required>
          ${problemOptions.map((issue) => `<option value="${escapeHtml(issue)}">${escapeHtml(issue)}</option>`).join('')}
        </select>
        <label class="form-label" for="request-notes">Describe what happened <span>(optional)</span></label>
        <textarea id="request-notes" name="notes" rows="3" maxlength="300" placeholder="For example: the car will not start"></textarea>
        <p class="request-location-note">Your selected location is shared with this mechanic: ${escapeHtml(locationLabel)}</p>
        <div class="dialog-actions">
          <button class="quiet-button" type="button" data-close-dialog>Cancel</button>
          <button class="primary-button" type="submit">Send request</button>
        </div>
      </form>
    </dialog>
  `
}

function mechanicProfileForm(profile: MechanicProfile | null): string {
  return `
    <form id="mechanic-profile-form" class="dashboard-card profile-edit-form">
      <div class="dashboard-card-heading"><div><span class="field-label">PROVIDER DETAILS</span><h2>${profile ? 'Update your provider profile' : 'Set up your provider profile'}</h2></div></div>
      <p class="section-subtitle">Your profile stays hidden from driver search until an administrator verifies it.</p>
      <label for="provider-name">Business or provider name</label>
      <input id="provider-name" name="name" maxlength="160" value="${escapeHtml(profile?.name ?? '')}" required />
      <label for="provider-area">Service area</label>
      <select id="provider-area" name="area" required>
        <option value="">Choose a Kampala area</option>
        ${manualAreas.map((area) => `<option value="${escapeHtml(area.id)}" ${profile?.area === area.label ? 'selected' : ''}>${escapeHtml(area.label)}</option>`).join('')}
      </select>
      <label for="provider-mode">How do you provide service?</label>
      <select id="provider-mode" name="service_mode" required>
        <option value="mobile" ${profile?.service_mode === 'mobile' ? 'selected' : ''}>I travel to the vehicle</option>
        <option value="garage" ${profile?.service_mode === 'garage' ? 'selected' : ''}>Drivers visit my garage</option>
      </select>
      <label for="provider-phone">Contact phone</label>
      <input id="provider-phone" name="phone" type="tel" maxlength="30" value="${escapeHtml(profile?.phone ?? '')}" placeholder="Optional phone number" />
      <fieldset class="service-checkboxes"><legend>Services offered</legend>
        ${issueOptions.map((service) => `<label><input type="checkbox" name="services" value="${escapeHtml(service)}" ${(profile?.services ?? []).includes(service) ? 'checked' : ''} /><span>${escapeHtml(service)}</span></label>`).join('')}
      </fieldset>
      <p class="auth-status" id="provider-status" role="status" aria-live="polite"></p>
      <button class="primary-button" type="submit">${profile ? 'Save profile changes' : 'Submit for verification'}</button>
    </form>
  `
}

function mechanicRequestCards(): string {
  if (requestsError) return `<p class="form-error">${escapeHtml(requestsError)}</p>`
  if (requestsLoading) return '<div class="empty-dashboard">Loading assistance requests…</div>'
  if (assistanceRequests.length === 0) {
    return '<div class="empty-dashboard"><span class="empty-icon">↗</span><h3>No requests yet</h3><p>New driver requests will appear here after your profile is verified and available.</p></div>'
  }
  return assistanceRequests
    .map(
      (request) => `
        <article class="request-row">
          <div class="request-row-icon">!</div>
          <div class="request-row-content">
            <span class="status-pill status-${request.status}">${escapeHtml(request.status)}</span>
            <h3>${escapeHtml(request.issue)} · ${escapeHtml(request.driverName)}</h3>
            <p>${escapeHtml(request.notes || 'No extra details')} · ${request.serviceMode === 'mobile' ? 'Travel to driver' : 'Garage visit'}</p>
            <p>${request.latitude.toFixed(4)}, ${request.longitude.toFixed(4)}</p>
          </div>
          <div class="request-row-actions">
            ${request.status === 'pending' ? `<button class="primary-button compact-button" type="button" data-request-status="${request.id}" data-next-status="accepted">Accept</button><button class="quiet-button" type="button" data-request-status="${request.id}" data-next-status="rejected">Reject</button>` : ''}
            ${request.status === 'accepted' ? `<button class="primary-button compact-button" type="button" data-request-status="${request.id}" data-next-status="completed">Mark complete</button>` : ''}
            ${request.status !== 'rejected' ? `<button class="quiet-button" type="button" data-messages="${request.id}">Messages</button>` : ''}
          </div>
        </article>
      `,
    )
    .join('')
}

function mechanicScreen(): string {
  if (!currentAccount) {
    return `<section class="dashboard"><div class="auth-required"><span class="eyebrow">MECHANIC WORKSPACE</span><h1>Manage your assistance requests</h1><p>Sign in with a mechanic account to set up your provider profile and respond to drivers.</p><button class="home-primary-button" type="button" data-screen="login">Sign in <span aria-hidden="true">→</span></button></div></section>`
  }
  if (currentAccount.profile.role !== 'mechanic') {
    return `<section class="dashboard"><div class="auth-required"><h1>Mechanic account required</h1><p>You’re signed in as a driver. Sign out and create a mechanic account to list your services.</p></div></section>`
  }
  if (workspaceLoading) {
    return '<section class="dashboard"><div class="empty-dashboard">Loading your mechanic workspace…</div></section>'
  }
  if (workspaceError) {
    return `<section class="dashboard"><div class="auth-required"><h1>Could not load mechanic workspace</h1><p>${escapeHtml(workspaceError)}</p><button class="quiet-button" type="button" data-retry-workspace>Try again</button></div></section>`
  }
  if (!mechanicProfile) {
    return `<section class="dashboard"><div class="section-heading"><div class="eyebrow">MECHANIC WORKSPACE</div><h1>Welcome, <span class="heading-accent">${escapeHtml(currentAccount.name)}.</span></h1><p class="section-subtitle">Create your provider profile to request admin verification. Drivers only see verified profiles.</p></div>${mechanicProfileForm(null)}</section>`
  }
  const verificationMessage = mechanicProfile.is_verified
    ? '<span class="verified-tag">VERIFIED</span>'
    : '<span class="review-state">Verification pending</span>'
  return `
    <section class="dashboard">
      <div class="section-heading">
        <div class="eyebrow">MECHANIC WORKSPACE</div>
        <h1>Welcome, <span class="heading-accent">${escapeHtml(currentAccount.name)}.</span></h1>
        <p class="section-subtitle">Manage incoming assistance requests and communicate with drivers.</p>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-main">
          <div class="dashboard-card">
            <div class="dashboard-card-heading"><div><span class="field-label">INCOMING REQUESTS</span><h2>Assistance requests</h2></div>${verificationMessage}</div>
            ${mechanicRequestCards()}
          </div>
          <details class="dashboard-card"><summary>Update provider profile</summary>${mechanicProfileForm(mechanicProfile)}</details>
        </div>
        <aside class="dashboard-side">
          <div class="dashboard-card availability-card">
            <span class="field-label">YOUR STATUS</span>
            <h2>${mechanicProfile.is_available ? 'Available for requests' : 'Not taking requests'}</h2>
            <p>${mechanicProfile.is_verified ? 'Availability is visible to drivers.' : 'Your profile must be verified before drivers can find it.'}</p>
            <button id="availability-toggle" class="primary-button ${mechanicProfile.is_available ? '' : 'button-muted'}" type="button" ${mechanicProfile.is_verified ? '' : 'disabled'}>${mechanicProfile.is_available ? 'Go unavailable' : 'Go available'}</button>
          </div>
          <div class="dashboard-card profile-preview">
            <span class="field-label">PROVIDER PROFILE</span>
            <div class="profile-avatar">M</div>
            <h3>${escapeHtml(mechanicProfile.name)}</h3>
            <p>${escapeHtml(mechanicProfile.area)} · ${mechanicProfile.service_mode === 'mobile' ? 'Travels to vehicles' : 'Garage visits'}</p>
            ${verificationMessage}
          </div>
        </aside>
      </div>
    </section>
  `
}

function adminScreen(): string {
  return `
    <section class="dashboard">
      <div class="section-heading">
        <div class="eyebrow">ADMINISTRATION · DEMO</div>
        <h1>Keep the network<br /><span class="heading-accent">trustworthy.</span></h1>
        <p class="section-subtitle">A preview of the listing and verification tools for a future admin workspace.</p>
      </div>
      <div class="dashboard-grid">
        <div class="dashboard-main">
          <div class="dashboard-card">
            <div class="dashboard-card-heading"><div><span class="field-label">PROVIDER DIRECTORY</span><h2>Sample listings</h2></div><span class="demo-tag">ILLUSTRATIVE DATA</span></div>
            <div class="admin-list">
              ${demoMechanics
                .map(
                  (mechanic) => `
                    <div class="admin-row"><div class="provider-avatar">${escapeHtml(mechanic.name.split(' ').map((word) => word[0]).slice(0, 2).join(''))}</div><div><strong>${escapeHtml(mechanic.name)}</strong><span>${escapeHtml(mechanic.area)} · ${mechanic.services.length} service categories</span></div><span class="review-state">Unverified</span></div>
                  `,
                )
                .join('')}
            </div>
          </div>
        </div>
        <aside class="dashboard-side">
          <div class="dashboard-card stats-card"><span class="field-label">DEMO DIRECTORY</span><strong>${demoMechanics.length}</strong><p>sample provider profiles</p><hr /><strong>0</strong><p>verified providers</p></div>
          <div class="dashboard-card"><span class="field-label">ADMIN ACCESS</span><h2>Secure access is not set up</h2><p>Authentication, permissions and audit history must be implemented before real provider records are managed.</p></div>
        </aside>
      </div>
      <div class="prototype-banner"><strong>Prototype only</strong><span>These sample records are not real businesses. Admin actions and verification are not enabled.</span></div>
    </section>
  `
}

function render(): void {
  if (!app) {
    throw new Error('App root element #app was not found.')
  }

  if (map) {
    map.remove()
    map = null
  }

  const content =
    currentScreen === 'home'
      ? homeScreen()
      : currentScreen === 'driver'
        ? driverScreen()
        : currentScreen === 'mechanic'
          ? mechanicScreen()
          : currentScreen === 'admin'
            ? adminScreen()
            : authScreen(currentScreen === 'register')
  app.innerHTML = `
    <header class="topbar">
      <a class="brand" href="#" aria-label="Makanika Connect home">
        <span class="brand-mark" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M14.7 6.3a5 5 0 0 0-6.4 6.4l-4.8 4.8a2.1 2.1 0 0 0 3 3l4.8-4.8a5 5 0 0 0 6.4-6.4l-3 3-3-3 3-3Z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
        <span class="brand-name">makanika<span>connect</span></span>
        <span class="prototype-label">PREVIEW</span>
      </a>
      <nav class="main-nav" aria-label="Main navigation">
        <button class="${currentScreen === 'home' ? 'nav-active' : ''}" type="button" data-screen="home">Home</button>
        <button class="${currentScreen === 'driver' ? 'nav-active' : ''}" type="button" data-screen="driver">Find help</button>
        <button class="${currentScreen === 'mechanic' ? 'nav-active' : ''}" type="button" data-screen="mechanic">Mechanic</button>
        <button class="${currentScreen === 'admin' ? 'nav-active' : ''}" type="button" data-screen="admin">Admin</button>
      </nav>
      <div class="header-account">
        ${currentAccount
          ? `<span class="header-user" title="${escapeHtml(currentAccount.email)}">${escapeHtml(currentAccount.name)}</span><button class="account-action" type="button" data-logout>Sign out</button>`
          : `<button class="account-action" type="button" data-screen="login">Sign in</button><button class="account-action account-action-primary" type="button" data-screen="register">Sign up</button>`}
      </div>
    </header>
    ${content}
    <dialog id="message-dialog" class="request-dialog message-dialog">
      <form id="message-form">
        <button class="dialog-close" type="button" data-close-message aria-label="Close">×</button>
        <div class="eyebrow">REQUEST CONVERSATION</div>
        <h2>Messages</h2>
        <div id="message-thread" class="message-thread"><p>Loading messages…</p></div>
        <label class="form-label" for="message-input">Send a message</label>
        <textarea id="message-input" name="message" rows="2" maxlength="2000" required placeholder="Share an update or ask a question"></textarea>
        <p id="message-status" class="auth-status" role="status"></p>
        <div class="dialog-actions"><button class="quiet-button" type="button" data-close-message>Close</button><button class="primary-button" type="submit">Send message</button></div>
      </form>
    </dialog>
    <dialog id="review-dialog" class="request-dialog">
      <form id="review-form">
        <button class="dialog-close" type="button" data-close-review aria-label="Close">×</button>
        <div class="eyebrow">SERVICE FEEDBACK</div>
        <h2>Rate your mechanic</h2>
        <p class="dialog-intro">Reviews are available after a request is marked complete.</p>
        <label class="form-label" for="review-rating">Rating</label>
        <select id="review-rating" name="rating" required><option value="5">★★★★★ — Excellent</option><option value="4">★★★★ — Good</option><option value="3">★★★ — Okay</option><option value="2">★★ — Poor</option><option value="1">★ — Bad</option></select>
        <label class="form-label" for="review-comment">Your review <span>(optional)</span></label>
        <textarea id="review-comment" name="comment" rows="3" maxlength="1000" placeholder="How was the service?"></textarea>
        <p id="review-status" class="auth-status" role="status"></p>
        <div class="dialog-actions"><button class="quiet-button" type="button" data-close-review>Cancel</button><button class="primary-button" type="submit">Submit review</button></div>
      </form>
    </dialog>
    <dialog id="provider-reviews-dialog" class="request-dialog">
      <div class="provider-reviews-content">
        <button class="dialog-close" type="button" data-close-provider-reviews aria-label="Close">×</button>
        <div class="eyebrow">DRIVER FEEDBACK</div>
        <h2>Mechanic reviews</h2>
        <div id="provider-review-list" class="provider-review-list"></div>
      </div>
    </dialog>
    <div id="toast" class="toast" role="status" aria-live="polite"></div>
    <footer class="site-footer"><span>MAKANIKA CONNECT</span><span>Helping drivers find roadside support · Kampala preview</span><span>Not for emergency use</span></footer>
  `

  bindCommonEvents()
  if (currentScreen === 'driver') {
    initializeMap()
    bindDriverEvents()
    if (!mechanicsLoaded) void loadMechanics()
    if (currentAccount?.profile.role === 'driver' && !requestsLoaded) {
      void loadAssistanceRequests()
    }
  } else if (currentScreen === 'mechanic') {
    bindMechanicEvents()
    if (currentAccount?.profile.role === 'mechanic' && !mechanicProfileLoaded) {
      void loadMechanicWorkspace()
    }
  } else if (currentScreen === 'login' || currentScreen === 'register') {
    bindAuthEvents()
  }
}

function initializeMap(): void {
  const mapElement = document.querySelector<HTMLDivElement>('#map')
  if (!mapElement) return

  const mapInstance = L.map(mapElement, { zoomControl: false, scrollWheelZoom: false }).setView(
    [currentLocation.lat, currentLocation.lng],
    12,
  )
  map = mapInstance
  L.control.zoom({ position: 'bottomright' }).addTo(mapInstance)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    maxZoom: 19,
  }).addTo(mapInstance)

  const userIcon = L.divIcon({
    className: 'map-pin-user',
    html: '<span></span>',
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  })
  L.marker([currentLocation.lat, currentLocation.lng], { icon: userIcon })
    .addTo(mapInstance)
    .bindPopup(`<strong>Your location</strong><br>${locationIsLive ? 'Device GPS' : 'Approximate demo location'}`)

  getVisibleMechanics().forEach((mechanic, index) => {
    const icon = L.divIcon({
      className: 'map-pin-mechanic',
      html: `<span><b>${index + 1}</b></span>`,
      iconSize: [30, 36],
      iconAnchor: [15, 34],
    })
    L.marker([mechanic.lat, mechanic.lng], { icon })
      .addTo(mapInstance)
      .bindPopup(`<strong>${escapeHtml(mechanic.name)}</strong><br>${escapeHtml(mechanic.area)} · ${mechanic.distance.toFixed(1)} km<br><small>${mechanic.isDemo ? 'Sample location' : 'Verified provider'}</small>`)
      .on('click', () => {
        selectedMechanicId = mechanic.id
        document.querySelectorAll<HTMLElement>('[data-mechanic-card]').forEach((card) => {
          card.classList.toggle('is-selected', card.dataset.mechanicCard === mechanic.id)
        })
      })
  })
}

function bindCommonEvents(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-screen]').forEach((button) => {
    button.addEventListener('click', () => {
      const screen = button.dataset.screen
      if (
        screen === 'home' ||
        screen === 'driver' ||
        screen === 'mechanic' ||
        screen === 'admin' ||
        screen === 'login' ||
        screen === 'register'
      ) {
        currentScreen = screen
        render()
      }
    })
  })
  document.querySelector<HTMLAnchorElement>('.brand')?.addEventListener('click', (event) => {
    event.preventDefault()
    currentScreen = 'home'
    render()
  })
  document.querySelector<HTMLButtonElement>('[data-logout]')?.addEventListener('click', signOut)
  document.querySelectorAll<HTMLButtonElement>('[data-messages]').forEach((button) => {
    button.addEventListener('click', () => {
      const requestId = Number(button.dataset.messages)
      if (Number.isInteger(requestId)) void openRequestMessages(requestId)
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-review]').forEach((button) => {
    button.addEventListener('click', () => {
      const requestId = Number(button.dataset.review)
      if (!Number.isInteger(requestId)) return
      selectedReviewRequestId = requestId
      document.querySelector<HTMLDialogElement>('#review-dialog')?.showModal()
    })
    document.querySelectorAll<HTMLButtonElement>('[data-provider-reviews]').forEach((button) => {
      button.addEventListener('click', () => {
        const mechanicId = Number(button.dataset.providerReviews)
        if (Number.isInteger(mechanicId)) void openProviderReviews(mechanicId)
      })
    })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-close-message]').forEach((button) => {
    button.addEventListener('click', () => document.querySelector<HTMLDialogElement>('#message-dialog')?.close())
  })
  document.querySelectorAll<HTMLButtonElement>('[data-close-review]').forEach((button) => {
    button.addEventListener('click', () => document.querySelector<HTMLDialogElement>('#review-dialog')?.close())
  })
  document.querySelector<HTMLButtonElement>('[data-close-provider-reviews]')?.addEventListener('click', () => {
    document.querySelector<HTMLDialogElement>('#provider-reviews-dialog')?.close()
  })
  bindMessageEvents()
  bindReviewEvents()
}

function bindAuthEvents(): void {
  document.querySelector<HTMLFormElement>('[data-auth-form]')?.addEventListener('submit', async (event) => {
    event.preventDefault()
    const form = event.currentTarget
    if (!(form instanceof HTMLFormElement)) return
    const submitButton = form.querySelector<HTMLButtonElement>('[type="submit"]')
    const status = form.querySelector<HTMLParagraphElement>('.auth-status')
    if (submitButton) submitButton.disabled = true
    if (status) status.textContent = ''

    try {
      const actionVersion = ++authStateVersion
      if (!csrfToken) await refreshCsrfToken()
      const formData = new FormData(form)
      const registering = form.dataset.register === 'true'
      const payload = registering
        ? {
            name: String(formData.get('name') ?? '').trim(),
            email: String(formData.get('email') ?? '').trim(),
            password: String(formData.get('password') ?? ''),
            role: String(formData.get('role') ?? 'driver'),
          }
        : {
            email: String(formData.get('email') ?? '').trim(),
            password: String(formData.get('password') ?? ''),
          }
      const response = await fetch(`/api/auth/${registering ? 'register' : 'login'}/`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify(payload),
      })
      const result = await readApiJson(response)
      if (!response.ok) throw new Error(apiErrorMessage(result))
      const accountResponse = parseAuthResponse(result)
      if (actionVersion !== authStateVersion) return
      currentAccount = accountResponse.user
      csrfToken = accountResponse.csrfToken
      mechanicProfile = null
      mechanicProfileLoaded = false
      requestsLoaded = false
      requestsError = ''
      currentScreen =
        currentAccount.profile.role === 'mechanic' ? 'mechanic' : postAuthScreen
      postAuthScreen = 'home'
      render()
    } catch (error) {
      if (status) {
        status.textContent =
          error instanceof Error ? error.message : 'Unable to complete sign-in. Please try again.'
      }
    } finally {
      if (submitButton?.isConnected) submitButton.disabled = false
    }
  })
}

async function refreshCsrfToken(): Promise<void> {
  const response = await fetch('/api/auth/csrf/', { credentials: 'same-origin' })
  const result = await readApiJson(response)
  if (
    !response.ok ||
    typeof result !== 'object' ||
    result === null ||
    !('csrfToken' in result) ||
    typeof result.csrfToken !== 'string'
  ) {
    throw new Error('Could not start a secure account session. Please try again.')
  }
  csrfToken = result.csrfToken
}

function parseAuthResponse(value: unknown): { user: Account; csrfToken: string } {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('user' in value) ||
    !('csrfToken' in value) ||
    typeof value.csrfToken !== 'string'
  ) {
    throw new Error('The account service returned an invalid sign-in response.')
  }
  return { user: parseAccount(value.user), csrfToken: value.csrfToken }
}

function parseAccount(value: unknown): Account {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('id' in value) ||
    typeof value.id !== 'number' ||
    !('email' in value) ||
    typeof value.email !== 'string' ||
    !('name' in value) ||
    typeof value.name !== 'string' ||
    !('profile' in value) ||
    typeof value.profile !== 'object' ||
    value.profile === null ||
    !('role' in value.profile) ||
    (value.profile.role !== 'driver' && value.profile.role !== 'mechanic') ||
    !('provider_profile' in value) ||
    (value.provider_profile !== null &&
      (typeof value.provider_profile !== 'object' ||
        value.provider_profile === null ||
        !('id' in value.provider_profile) ||
        typeof value.provider_profile.id !== 'number' ||
        !('is_verified' in value.provider_profile) ||
        typeof value.provider_profile.is_verified !== 'boolean'))
  ) {
    throw new Error('The account service returned invalid account information.')
  }
  return {
    id: value.id,
    email: value.email,
    name: value.name,
    profile: { role: value.profile.role },
    provider_profile:
      value.provider_profile === null
        ? null
        : { id: value.provider_profile.id, is_verified: value.provider_profile.is_verified },
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isService(value: unknown): value is Service {
  return typeof value === 'string' && serviceSet.has(value)
}

function parseMechanic(value: unknown): Mechanic {
  const services = isRecord(value) ? value.services : null
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.name !== 'string' ||
    typeof value.area !== 'string' ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number' ||
    typeof value.rating !== 'number' ||
    typeof value.review_count !== 'number' ||
    typeof value.eta !== 'string' ||
    typeof value.is_available !== 'boolean' ||
    !Array.isArray(services) ||
    !services.every(isService) ||
    (value.service_mode !== 'mobile' && value.service_mode !== 'garage') ||
    typeof value.is_demo !== 'boolean' ||
    typeof value.is_verified !== 'boolean'
  ) {
    throw new Error('The provider service returned invalid profile information.')
  }
  return {
    id: value.id,
    name: value.name,
    area: value.area,
    lat: value.latitude,
    lng: value.longitude,
    rating: value.rating,
    reviews: value.review_count,
    eta: value.eta,
    available: value.is_available,
    services,
    serviceMode: value.service_mode,
    isDemo: value.is_demo,
    isVerified: value.is_verified,
  }
}

function parseAssistanceRequest(value: unknown): AssistanceRequest {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.mechanic !== 'number' ||
    typeof value.mechanic_name !== 'string' ||
    typeof value.driver_name !== 'string' ||
    typeof value.issue !== 'string' ||
    typeof value.notes !== 'string' ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number' ||
    (value.service_mode !== 'mobile' && value.service_mode !== 'garage') ||
    (value.status !== 'pending' &&
      value.status !== 'accepted' &&
      value.status !== 'rejected' &&
      value.status !== 'completed') ||
    typeof value.created_at !== 'string' ||
    typeof value.has_review !== 'boolean'
  ) {
    throw new Error('The request service returned invalid assistance request information.')
  }
  return {
    id: value.id,
    mechanic: value.mechanic,
    mechanicName: value.mechanic_name,
    driverName: value.driver_name,
    issue: value.issue,
    notes: value.notes,
    latitude: value.latitude,
    longitude: value.longitude,
    serviceMode: value.service_mode,
    status: value.status,
    createdAt: value.created_at,
    hasReview: value.has_review,
  }
}

function parseMechanicProfile(value: unknown): MechanicProfile | null {
  if (value === null) return null
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.name !== 'string' ||
    typeof value.area !== 'string' ||
    typeof value.latitude !== 'number' ||
    typeof value.longitude !== 'number' ||
    (value.service_mode !== 'mobile' && value.service_mode !== 'garage') ||
    typeof value.phone !== 'string' ||
    !Array.isArray(value.services) ||
    !value.services.every(isService) ||
    typeof value.eta !== 'string' ||
    typeof value.is_available !== 'boolean' ||
    typeof value.is_verified !== 'boolean' ||
    typeof value.is_demo !== 'boolean' ||
    typeof value.rating !== 'number' ||
    typeof value.review_count !== 'number'
  ) {
    throw new Error('The provider service returned invalid profile information.')
  }
  return {
    id: value.id,
    name: value.name,
    area: value.area,
    latitude: value.latitude,
    longitude: value.longitude,
    service_mode: value.service_mode,
    phone: value.phone,
    services: value.services,
    eta: value.eta,
    is_available: value.is_available,
    is_verified: value.is_verified,
    is_demo: value.is_demo,
    rating: value.rating,
    review_count: value.review_count,
  }
}

function parseRequestMessage(value: unknown): RequestMessage {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.sender !== 'number' ||
    typeof value.sender_name !== 'string' ||
    typeof value.message !== 'string' ||
    typeof value.created_at !== 'string'
  ) {
    throw new Error('The messaging service returned invalid message information.')
  }
  return {
    id: value.id,
    sender: value.sender,
    senderName: value.sender_name,
    message: value.message,
    createdAt: value.created_at,
  }
}

function parseProviderReview(value: unknown): ProviderReview {
  if (
    !isRecord(value) ||
    typeof value.id !== 'number' ||
    typeof value.driver_name !== 'string' ||
    typeof value.rating !== 'number' ||
    typeof value.comment !== 'string' ||
    typeof value.created_at !== 'string'
  ) {
    throw new Error('The review service returned invalid review information.')
  }
  return {
    id: value.id,
    driverName: value.driver_name,
    rating: value.rating,
    comment: value.comment,
    createdAt: value.created_at,
  }
}

async function openProviderReviews(mechanicId: number): Promise<void> {
  const dialog = document.querySelector<HTMLDialogElement>('#provider-reviews-dialog')
  const list = document.querySelector<HTMLDivElement>('#provider-review-list')
  if (!dialog || !list) return
  list.innerHTML = '<p>Loading reviews…</p>'
  dialog.showModal()
  try {
    const response = await fetch(`/api/mechanics/${mechanicId}/reviews/`)
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    if (!Array.isArray(result)) throw new Error('The review service returned an invalid result.')
    const reviews = result.map(parseProviderReview)
    list.innerHTML =
      reviews.length === 0
        ? '<p class="empty-state">No written reviews are available yet.</p>'
        : reviews
            .map(
              (review) => `
                <article class="provider-review">
                  <div><strong>${escapeHtml(review.driverName)}</strong><span class="rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</span></div>
                  ${review.comment ? `<p>${escapeHtml(review.comment)}</p>` : ''}
                  <time>${escapeHtml(new Date(review.createdAt).toLocaleDateString())}</time>
                </article>
              `,
            )
            .join('')
  } catch (error) {
    list.innerHTML = `<p class="form-error">${escapeHtml(error instanceof Error ? error.message : 'Could not load reviews.')}</p>`
  }
}

async function loadMechanics(): Promise<void> {
  if (mechanicsLoading || mechanicsLoaded) return
  mechanicsLoading = true
  mechanicsError = ''
  try {
    const response = await fetch('/api/mechanics/')
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    if (!Array.isArray(result)) throw new Error('The provider service returned an invalid result.')
    liveMechanics = result.map(parseMechanic)
    mechanicsLoaded = true
  } catch (error) {
    mechanicsError = error instanceof Error ? error.message : 'Could not load verified providers.'
    mechanicsLoaded = true
  } finally {
    mechanicsLoading = false
    if (currentScreen === 'driver') render()
  }
}

async function loadAssistanceRequests(): Promise<void> {
  if (!currentAccount || requestsLoading || requestsLoaded) return
  requestsLoading = true
  requestsError = ''
  try {
    const response = await fetch('/api/requests/', { credentials: 'same-origin' })
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    if (!Array.isArray(result)) throw new Error('The request service returned an invalid result.')
    assistanceRequests = result.map(parseAssistanceRequest)
    requestsLoaded = true
  } catch (error) {
    requestsError = error instanceof Error ? error.message : 'Could not load your requests.'
    requestsLoaded = true
  } finally {
    requestsLoading = false
    if (currentScreen === 'driver' || currentScreen === 'mechanic') render()
  }
}

async function reloadAssistanceRequests(): Promise<void> {
  requestsLoaded = false
  requestsError = ''
  await loadAssistanceRequests()
}

async function loadMechanicWorkspace(): Promise<void> {
  if (workspaceLoading || mechanicProfileLoaded || !currentAccount) return
  workspaceLoading = true
  workspaceError = ''
  try {
    const response = await fetch('/api/mechanic/profile/', { credentials: 'same-origin' })
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    mechanicProfile = parseMechanicProfile(result)
    mechanicProfileLoaded = true
    requestsLoaded = false
    await loadAssistanceRequests()
  } catch (error) {
    workspaceError = error instanceof Error ? error.message : 'Could not load the mechanic workspace.'
  } finally {
    workspaceLoading = false
    if (currentScreen === 'mechanic') render()
  }
}

async function readApiJson(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) {
    throw new Error(`The account service returned an unexpected response (${response.status}).`)
  }
  return response.json()
}

function apiErrorMessage(result: unknown): string {
  if (typeof result !== 'object' || result === null) return 'The account request failed.'
  if ('detail' in result && typeof result.detail === 'string') return result.detail
  const messages = Object.values(result).flatMap((value) =>
    Array.isArray(value) ? value.map(String) : [String(value)],
  )
  return messages.join(' ') || 'The account request failed.'
}

async function signOut(): Promise<void> {
  const actionVersion = ++authStateVersion
  try {
    if (!csrfToken) await refreshCsrfToken()
    const response = await fetch('/api/auth/logout/', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-CSRFToken': csrfToken },
    })
    if (!response.ok) {
      const result = await readApiJson(response)
      throw new Error(apiErrorMessage(result))
    }
    if (actionVersion !== authStateVersion) return
    currentAccount = null
    mechanicProfile = null
    mechanicProfileLoaded = false
    assistanceRequests = []
    requestsLoaded = false
    currentScreen = 'home'
    render()
  } catch (error) {
    console.error('Sign out failed:', error)
  }
}

async function restoreAccount(): Promise<void> {
  const restoreVersion = authStateVersion
  try {
    await refreshCsrfToken()
    const response = await fetch('/api/auth/me/', { credentials: 'same-origin' })
    if (response.status === 401 || response.status === 403) return
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    if (restoreVersion !== authStateVersion) return
    currentAccount = parseAccount(result)
    render()
  } catch (error) {
    console.error('Could not restore the account session:', error)
  }
}

function bindDriverEvents(): void {
  document.querySelector<HTMLButtonElement>('#locate-button')?.addEventListener('click', locateDriver)

  const manualAreaSelect = document.querySelector<HTMLSelectElement>('#manual-area')
  manualAreaSelect?.addEventListener('change', () => {
    const areaId = manualAreaSelect.value
    const area = manualAreas.find((candidate) => candidate.id === areaId)
    if (!area) return
    currentLocation = { lat: area.lat, lng: area.lng }
    locationLabel = `${area.label}, Kampala · approximate area`
    locationIsLive = false
    selectedManualAreaId = area.id
    render()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      const filter = button.dataset.filter
      const nextFilter =
        filter === 'All services' ? 'All services' : issueOptions.find((service) => service === filter)
      if (!nextFilter) return
      selectedService = nextFilter
      render()
    })
  })

  const radiusFilter = document.querySelector<HTMLInputElement>('#radius-filter')
  radiusFilter?.addEventListener('input', (event) => {
    const input = event.currentTarget
    if (!(input instanceof HTMLInputElement)) return
    searchRadius = Number(input.value)
    render()
  })

  const availabilityFilter = document.querySelector<HTMLInputElement>('#availability-filter')
  availabilityFilter?.addEventListener('change', (event) => {
    const input = event.currentTarget
    if (!(input instanceof HTMLInputElement)) return
    onlyAvailable = input.checked
    render()
  })

  document.querySelector<HTMLButtonElement>('#clear-filters')?.addEventListener('click', () => {
    selectedService = 'All services'
    searchRadius = 30
    onlyAvailable = false
    render()
  })

  document.querySelectorAll<HTMLButtonElement>('[data-request]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!currentAccount || currentAccount.profile.role !== 'driver') {
        postAuthScreen = 'driver'
        currentScreen = 'login'
        render()
        return
      }
      selectedMechanicId = Number(button.dataset.request)
      const dialog = document.querySelector<HTMLDialogElement>('#request-dialog')
      const preferredIssue = liveMechanics.find((mechanic) => mechanic.id === selectedMechanicId)?.services[0]
      const select = document.querySelector<HTMLSelectElement>('#issue-select')
      if (select && preferredIssue) select.value = preferredIssue
      const provider = liveMechanics.find((mechanic) => mechanic.id === selectedMechanicId)
      const modeNote = document.querySelector<HTMLParagraphElement>('#request-mode-note')
      if (modeNote && provider) {
        modeNote.textContent =
          provider.serviceMode === 'mobile'
            ? `${provider.name} travels to the vehicle location you share.`
            : `${provider.name} provides service at their garage.`
      }
      dialog?.showModal()
    })
  })

  const dialog = document.querySelector<HTMLDialogElement>('#request-dialog')
  const form = document.querySelector<HTMLFormElement>('#request-form')
  document.querySelector<HTMLButtonElement>('.dialog-close')?.addEventListener('click', () => dialog?.close())
  document.querySelector<HTMLButtonElement>('[data-close-dialog]')?.addEventListener('click', () => dialog?.close())
  dialog?.addEventListener('click', (event) => {
    if (event.target === dialog) dialog.close()
  })
  form?.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!dialog || !form || currentAccount?.profile.role !== 'driver') return
    const formData = new FormData(form)
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')
    if (submit) submit.disabled = true
    try {
      const response = await fetch('/api/requests/', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({
          mechanic: Number(selectedMechanicId),
          issue: String(formData.get('issue') ?? ''),
          notes: String(formData.get('notes') ?? '').trim(),
          latitude: currentLocation.lat,
          longitude: currentLocation.lng,
        }),
      })
      const result = await readApiJson(response)
      if (!response.ok) throw new Error(apiErrorMessage(result))
      dialog.close()
      form.reset()
      await reloadAssistanceRequests()
      showToast('Your assistance request was sent to the selected verified provider.')
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Could not send the assistance request.')
    } finally {
      if (submit?.isConnected) submit.disabled = false
    }
  })
}

function bindMechanicEvents(): void {
  document.querySelector<HTMLButtonElement>('[data-retry-workspace]')?.addEventListener('click', () => {
    workspaceError = ''
    mechanicProfileLoaded = false
    render()
  })
  document.querySelector<HTMLFormElement>('#mechanic-profile-form')?.addEventListener('submit', saveMechanicProfile)
  document.querySelector<HTMLButtonElement>('#availability-toggle')?.addEventListener('click', async () => {
    if (!mechanicProfile) return
    await updateMechanicProfile({ is_available: !mechanicProfile.is_available })
  })
  document.querySelectorAll<HTMLButtonElement>('[data-request-status]').forEach((button) => {
    button.addEventListener('click', () => {
      const requestId = Number(button.dataset.requestStatus)
      const nextStatus = button.dataset.nextStatus
      if (
        Number.isInteger(requestId) &&
        (nextStatus === 'accepted' || nextStatus === 'rejected' || nextStatus === 'completed')
      ) {
        void updateAssistanceRequestStatus(requestId, nextStatus)
      }
    })
  })
}

async function saveMechanicProfile(event: SubmitEvent): Promise<void> {
  event.preventDefault()
  const form = event.currentTarget
  if (!(form instanceof HTMLFormElement) || currentAccount?.profile.role !== 'mechanic') return
  const statusElement = form.querySelector<HTMLParagraphElement>('#provider-status')
  const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')
  if (statusElement) statusElement.textContent = ''
  if (submit) submit.disabled = true

  try {
    const formData = new FormData(form)
    const selectedArea = manualAreas.find((area) => area.id === formData.get('area'))
    const services = formData.getAll('services').map(String)
    if (!selectedArea) throw new Error('Choose a service area.')
    if (services.length === 0) throw new Error('Choose at least one service.')
    if (!csrfToken) await refreshCsrfToken()
    const payload = {
      name: String(formData.get('name') ?? '').trim(),
      area: selectedArea.label,
      latitude: selectedArea.lat,
      longitude: selectedArea.lng,
      service_mode: String(formData.get('service_mode') ?? 'mobile'),
      phone: String(formData.get('phone') ?? '').trim(),
      services,
    }
    const response = await fetch('/api/mechanic/profile/', {
      method: mechanicProfile ? 'PATCH' : 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      body: JSON.stringify(payload),
    })
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    mechanicProfile = parseMechanicProfile(result)
    mechanicProfileLoaded = true
    mechanicsLoaded = false
    if (statusElement) {
      statusElement.textContent = 'Profile saved. It will appear in driver search after admin verification.'
    }
    render()
  } catch (error) {
    if (statusElement) {
      statusElement.textContent = error instanceof Error ? error.message : 'Could not save provider profile.'
    }
  } finally {
    if (submit?.isConnected) submit.disabled = false
  }
}

async function updateMechanicProfile(changes: { is_available: boolean }): Promise<void> {
  if (!mechanicProfile) return
  try {
    if (!csrfToken) await refreshCsrfToken()
    const response = await fetch('/api/mechanic/profile/', {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      body: JSON.stringify(changes),
    })
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    mechanicProfile = parseMechanicProfile(result)
    mechanicsLoaded = false
    render()
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not update your provider profile.')
  }
}

async function updateAssistanceRequestStatus(
  requestId: number,
  status: Extract<RequestStatus, 'accepted' | 'rejected' | 'completed'>,
): Promise<void> {
  try {
    if (!csrfToken) await refreshCsrfToken()
    const response = await fetch(`/api/requests/${requestId}/status/`, {
      method: 'PATCH',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
      body: JSON.stringify({ status }),
    })
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    await reloadAssistanceRequests()
    showToast(`Request marked ${status}.`)
  } catch (error) {
    showToast(error instanceof Error ? error.message : 'Could not update the request.')
  }
}

function bindMessageEvents(): void {
  const form = document.querySelector<HTMLFormElement>('#message-form')
  form?.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!form || selectedRequestId === null) return
    const input = form.querySelector<HTMLTextAreaElement>('#message-input')
    const statusElement = form.querySelector<HTMLParagraphElement>('#message-status')
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')
    const message = input?.value.trim() ?? ''
    if (!message) return
    if (statusElement) statusElement.textContent = ''
    if (submit) submit.disabled = true
    try {
      if (!csrfToken) await refreshCsrfToken()
      const response = await fetch(`/api/requests/${selectedRequestId}/messages/`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({ message }),
      })
      const result = await readApiJson(response)
      if (!response.ok) throw new Error(apiErrorMessage(result))
      form.reset()
      await openRequestMessages(selectedRequestId)
    } catch (error) {
      if (statusElement) {
        statusElement.textContent = error instanceof Error ? error.message : 'Could not send message.'
      }
    } finally {
      if (submit?.isConnected) submit.disabled = false
    }
  })
}

async function openRequestMessages(requestId: number): Promise<void> {
  const dialog = document.querySelector<HTMLDialogElement>('#message-dialog')
  const thread = document.querySelector<HTMLDivElement>('#message-thread')
  const statusElement = document.querySelector<HTMLParagraphElement>('#message-status')
  if (!dialog || !thread) return
  selectedRequestId = requestId
  if (statusElement) statusElement.textContent = ''
  thread.innerHTML = '<p>Loading messages…</p>'
  if (!dialog.open) dialog.showModal()
  try {
    const response = await fetch(`/api/requests/${requestId}/messages/`, {
      credentials: 'same-origin',
    })
    const result = await readApiJson(response)
    if (!response.ok) throw new Error(apiErrorMessage(result))
    if (!Array.isArray(result)) throw new Error('The messaging service returned an invalid result.')
    const messages = result.map(parseRequestMessage)
    thread.innerHTML =
      messages.length === 0
        ? '<p class="empty-state">No messages yet. Send a message to coordinate the assistance.</p>'
        : messages
            .map(
              (message) => `
                <article class="message-bubble ${message.sender === currentAccount?.id ? 'message-own' : ''}">
                  <strong>${escapeHtml(message.senderName)}</strong>
                  <p>${escapeHtml(message.message)}</p>
                  <time>${escapeHtml(new Date(message.createdAt).toLocaleString())}</time>
                </article>
              `,
            )
            .join('')
    thread.scrollTop = thread.scrollHeight
  } catch (error) {
    thread.innerHTML = ''
    if (statusElement) {
      statusElement.textContent = error instanceof Error ? error.message : 'Could not load messages.'
    }
  } finally {
  }
}

function bindReviewEvents(): void {
  const form = document.querySelector<HTMLFormElement>('#review-form')
  form?.addEventListener('submit', async (event) => {
    event.preventDefault()
    if (!form || selectedReviewRequestId === null) return
    const statusElement = form.querySelector<HTMLParagraphElement>('#review-status')
    const submit = form.querySelector<HTMLButtonElement>('[type="submit"]')
    if (statusElement) statusElement.textContent = ''
    if (submit) submit.disabled = true
    try {
      if (!csrfToken) await refreshCsrfToken()
      const formData = new FormData(form)
      const response = await fetch(`/api/requests/${selectedReviewRequestId}/review/`, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', 'X-CSRFToken': csrfToken },
        body: JSON.stringify({
          rating: Number(formData.get('rating')),
          comment: String(formData.get('comment') ?? '').trim(),
        }),
      })
      const result = await readApiJson(response)
      if (!response.ok) throw new Error(apiErrorMessage(result))
      document.querySelector<HTMLDialogElement>('#review-dialog')?.close()
      form.reset()
      await reloadAssistanceRequests()
      mechanicsLoaded = false
      if (currentScreen === 'driver') render()
      showToast('Thank you for sharing your review.')
    } catch (error) {
      if (statusElement) {
        statusElement.textContent = error instanceof Error ? error.message : 'Could not submit your review.'
      }
    } finally {
      if (submit?.isConnected) submit.disabled = false
    }
  })
}

function locateDriver(): void {
  const button = document.querySelector<HTMLButtonElement>('#locate-button')
  if (!navigator.geolocation) {
    showToast('Location is not supported by this browser. Allow location access or use the approximate demo location.')
    return
  }

  if (button) {
    button.disabled = true
    button.textContent = 'Locating…'
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      currentLocation = { lat: position.coords.latitude, lng: position.coords.longitude }
      locationLabel = `Your current location · ±${Math.round(position.coords.accuracy)} m`
      locationIsLive = true
      selectedManualAreaId = ''
      render()
      void restoreAccount()
      showToast('Your location is being used to sort the demo listings.')
    },
    (error) => {
      if (button) {
        button.disabled = false
        button.textContent = 'Use GPS'
      }
      const message =
        error.code === error.PERMISSION_DENIED
          ? 'Location permission was denied. Enable it in your browser settings to use GPS.'
          : error.code === error.POSITION_UNAVAILABLE
            ? 'Your location could not be determined. Try again or use the approximate demo location.'
            : 'Location request timed out. Try again when GPS is available.'
      showToast(message)
    },
    { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
  )
}

let toastTimeout: number | undefined
function showToast(message: string): void {
  const toast = document.querySelector<HTMLDivElement>('#toast')
  if (!toast) return
  toast.textContent = message
  toast.classList.add('toast-visible')
  window.clearTimeout(toastTimeout)
  toastTimeout = window.setTimeout(() => toast.classList.remove('toast-visible'), 5000)
}

render()

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error: unknown) => {
      console.error('Service worker registration failed:', error)
    })
  })
}
