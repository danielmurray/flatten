import csv
import datetime
import json
import math
import requests
import datetime

def mean(nums):
    return float(sum(nums)) / len(nums)

def rolling_average(array, window_size):
    rolling_averages = []
    for i, element  in enumerate(array):
        half_window_size = (window_size - 1) /2
        left = i - half_window_size if i - window_size > 0 else 0
        right = i + half_window_size if i + half_window_size < len(array) else len(array)

        left = i - window_size if i - window_size > 0 else 0
        right = i

        window = array[left: right + 1]
        rolling_averages.append(mean(window))
    return rolling_averages

def best_fit_state(state_dates):
    sorted_dates = sorted(state_dates)
    deaths = []

    state_date_states = {}
    for date in sorted_dates:
        death_count = state_dates[date]
        deaths.append(death_count)

    window_size = 7
    rolling_death_averages = rolling_average(deaths, window_size)

    deltas = [b-a for a, b in zip(rolling_death_averages[:-1], rolling_death_averages[1:])]
    rolling_delta_averages = rolling_average(deltas, window_size)

    delta_deltas = [b-a for a, b in zip(rolling_delta_averages[:-1], rolling_delta_averages[1:])]
    rolling_delta_delta_averages = rolling_average(delta_deltas, window_size)

    delta_delta_deltas = [b-a for a, b in zip(rolling_delta_delta_averages[:-1], rolling_delta_delta_averages[1:])]
    rolling_delta_delta_delta_averages = rolling_average(delta_delta_deltas, window_size)

    max_delta = max(rolling_delta_averages) or 1

    date_states = {}

    for i, date in enumerate(sorted_dates):
        if i < 3:
            continue

        death_count = rolling_death_averages[i]
        delta = rolling_delta_averages[i - 1]
        last_delta = rolling_delta_averages[i - 2]
        delta_delta = rolling_delta_delta_averages[i - 2]
        delta_delta_delta = rolling_delta_delta_delta_averages[i - 3]

        date = sorted_dates[i]
        state = 'no_cases'
        grow_value = delta / max_delta
        growth_factor = delta / last_delta  if last_delta else 0
        if death_count > 0:
            if delta_delta > 0:
                state = 'growing'
                # if delta_delta_delta > 0:
                #     state = 'exponential growth'
                # else:
                #     state = 'flattening'
            else:
                state = 'flattening'
                # if delta_delta_delta < 0:
                #     state = 'declining'
                # else:
                #     state = 'receding'


        print(
            date,
            # deaths[i],
            # deaths[i] - deaths[i-1],
            # death_count,
            # rolling_death_averages[i-1],
            # int(deltas[i-1]),
            # delta_deltas[i-2],
            # delta_delta_deltas[i-3],
            # int(death_count),
            int(delta),
            int(delta) / max_delta,
            # int(delta_delta),
            # int(delta_delta_delta),
            # state,
            # growth_factor
        )
        date_states[date] = {
            'growth_factor': growth_factor,
            'ratio': int(delta) / max_delta,
        }


    return date_states

def logistic(x, L, x_naught, kone, ktwo):
    if x <= x_naught:
        return L/(1 + math.e ** (-kone * (x - x_naught)))
    if x > x_naught:
        return L/(1 + math.e ** (-ktwo * (x - x_naught)))

def calculate_error(us_cases, L, x_naught, kone, ktwo):
    error = 0
    for x, cases in enumerate(us_cases):
        expected = logistic(x, L, x_naught, kone, ktwo)
        # print(x, expected, cases)
        error += (expected - int(cases)) ** 2
    return error

def graph(us_cases, L, x_naught, kone, ktwo):
    fig, ax = plt.subplots()
    x = np.arange(len(us_cases))
    width = 0.35
    expected = [ logistic(i, L, x_naught, kone, ktwo) for i in range(len(us_cases))]
    # print(len(us_cases), len(expected))
    rects1 = ax.bar(x - width/2, us_cases, width, label='Actual')
    rects2 = ax.bar(x + width/2, expected, width, label='Expected', color='red')
    plt.show()

def main():
    url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_confirmed_US.csv'
    index = 11
    # url = 'https://raw.githubusercontent.com/CSSEGISandData/COVID-19/master/csse_covid_19_data/csse_covid_19_time_series/time_series_covid19_deaths_US.csv'
    # index = 12

    response = requests.get(url)
    lines = response.text.splitlines()
    data = csv.reader(lines, delimiter=',')

    max_date = ''
    state_county_dates = {}
    counties_dates = {}
    dates = []
    for i, row in enumerate(data):
        if i is 0:
            dates = row[index:]
            continue

        countyID = row[0]
        county = row[5]
        state = row[6]
        county_dates = row[index:]

        if state not in state_county_dates:
            state_county_dates[state] = {}

        state_county_dates[state][countyID] = county_dates

    iso_dates = []
    for date in dates:
        month, day, year = date.split('/')
        d = datetime.date(
            2000 + int(year),
            int(month),
            int(day)
        )
        iso_dates.append(d.isoformat())

    states_dates = {}
    counties_dates = {}
    us_dates = {}
    for state, counties in state_county_dates.items():
        if state not in states_dates:
            states_dates[state] = {}

        for county, county_dates in counties.items():

            for i, cases in enumerate(county_dates):
                date = iso_dates[i]

                if date > max_date:
                    max_date = date

                if date not in states_dates[state]:
                    states_dates[state][date] = 0

                if county not in counties_dates:
                    counties_dates[county] = {}

                states_dates[state][date] += int(float(cases))
                counties_dates[county][date] = int(float(cases))

                if date not in us_dates:
                    us_dates[date] = 0

                us_dates[date] += int(float(cases))

    # states_date_states = {}
    # for state, state_dates in states_dates.items():
    #     # if state != 'New York':
    #     #     continue
    #     state_date_states = best_fit_state(state_dates)
    #     states_date_states[state] = state_date_states
    #
    # file='state_states.js'
    # with open(file, 'w') as filetowrite:
    #     filetowrite.write('window.state_states = ' + json.dumps(states_date_states))
    # print(max_date)

    counties_date_states = {}
    for county, county_dates in counties_dates.items():
        # if state != 'New York':
        #     continue
        county_date_states = best_fit_state(county_dates)
        counties_date_states[county] = county_date_states

    file='county_states.js'
    with open(file, 'w') as filetowrite:
        filetowrite.write('window.county_states = ' + json.dumps(counties_date_states))
    print(max_date)

    # for date in sorted_dates:
    #     cases = us_dates[date]
    #     print(date, cases)

    # OneMillion = 1000000
    # TwoMillion = 2000000
    # HundredThousand = 100000
    # sorted_dates = sorted(us_dates)
    # cases = [us_dates[date] for date in sorted_dates]
    # average_cases = rolling_average(cases, 7)

    # errors = {}
    # for L in range(OneMillion, TwoMillion, HundredThousand):
    #     for x_naught in range(100):
    #         for tenkone in range(10, 15):
    #             kone = float(tenkone)/100
    #             for tenktwo in range(10, 15):
    #                 ktwo = float(tenktwo)/100
    #                 error = calculate_error(average_cases, L, x_naught, kone, ktwo)
    #                 errors[error] = [L, x_naught, kone, ktwo]
    #                 print(L, x_naught, kone, ktwo, error)
    #
    # sorted_errors = sorted(errors)
    # for error in sorted_errors[:100]:
    #     print(errors[error], error)

    # graph(average_cases, 1230000, 86, 0.135, 0.15)

    # L = 1030000
    # k = 0.2
    # x_naught = 80
    # start = datetime.datetime(2020, 1, 22)
    # previous = 0
    # for x in range(0, 300):
    #     expected = L/(1 + math.e ** (-k * (x - x_naught)))
    #     day = start + datetime.timedelta(x)
    #     actual = us_dates[sorted_dates[x]] if x < len(sorted_dates) else None
    #     print(day, expected, actual)
    #     previous = expected



if __name__ == '__main__':
    main()
