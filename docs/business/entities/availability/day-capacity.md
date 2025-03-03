# Day capacity

Day capacity represents capacity of a single person for a single day.

Follows the [schema](day-capacity.json)

Within the database instances of this type should be referenced by ID.

Below is the list of possible options.

## Day off

The standard day off like Saturday and Sunday.

```json
{
    "id": "day-off",
    "name": "Day off",
    "availablility: 0
}
```

## Personal day

An additional non-working day other than Saturday or Sunday that's been agreed between the employee and the employer.

```json
{
    "id": "personal-day",
    "name": "Personal day",
    "availablility: 0
}
```

## Sick leave

Day off due to unforeseen medical circumstances.

```json
{
    "id": "sick-leave",
    "name": "Sick leave",
    "availablility: 0
}
```

## Work day

Working day. 

### Whole FTE

```json
{
    "id": "full",
    "name": "Work day",
    "availablility: 1
}
```

## Half FTE

```json
{
    "id": "1/2",
    "name": "Work day (1/2)",
    "availablility: 0.5
}
```

## Three quarters FTE

```json
{
    "id": "3/4",
    "name": "Work day (3/4)",
    "availablility: 0.75
}
```