export const GENRES = [
    'Pop', 'Rock', 'Hip Hop', 'Electronic', 'R&B', 'Indie', 'Jazz', 'Classical',
    'Metal', 'Country', 'Blues', 'Folk', 'Latin', 'Reggae', 'Soul', 'Funk',
    'Techno', 'House', 'Trap', 'Drill', 'Dance', 'Ambient', 'Lofi', 'Synthwave'
];

export const COUNTRIES = [
    'Turkey', 'United States', 'United Kingdom', 'Germany', 'France', 'Netherlands',
    'Spain', 'Italy', 'Sweden', 'Norway', 'Denmark', 'Belgium', 'Switzerland',
    'Austria', 'Canada', 'Australia', 'Japan', 'South Korea', 'Brazil', 'Mexico'
];

export const CITIES: { [key: string]: string[] } = {
    'Turkey': [
        'Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Adana', 'Konya',
        'Gaziantep', 'Mersin', 'Diyarbakir', 'Kayseri', 'Eskisehir', 'Samsun',
        'Denizli', 'Sanliurfa', 'Sakarya', 'Malatya', 'Erzurum', 'Trabzon', 'Kocaeli'
    ],
    'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami', 'San Francisco', 'Nashville'],
    'United Kingdom': ['London', 'Manchester', 'Birmingham', 'Glasgow', 'Liverpool'],
    'Germany': ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne'],
    'Default': ['London', 'New York', 'Paris', 'Berlin', 'Tokyo', 'Sydney', 'Toronto']
};
