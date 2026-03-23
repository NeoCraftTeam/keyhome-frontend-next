import {
  CheckCircle as CheckCircleIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  Wifi as WifiIcon,
  Pool as PoolIcon,
  AcUnit as AcUnitIcon,
  Elevator as ElevatorIcon,
  Kitchen as KitchenIcon,
  Yard as YardIcon,
  Fireplace as FireplaceIcon,
  FitnessCenter as FitnessCenterIcon,
  Security as SecurityIcon,
  LocalLaundryService as LaundryServiceIcon,
  Tv as TvIcon,
  BalconyOutlined as BalconyIcon,
  WaterDrop as WaterDropIcon,
  ElectricBolt as ElectricBoltIcon,
  Garage as GarageIcon,
  DirectionsCar as DirectionsCarIcon,
  Bathtub as BathtubIcon,
  Bed as BedIcon,
  Shower as ShowerIcon,
  LocalParking as ParkingIcon,
  LocalBar as LocalBarIcon,
  LocalCafe as LocalCafeIcon,
  Deck as DeckIcon,
  Fence as FenceIcon,
  Alarm as AlarmIcon,
  Roofing as RoofingIcon,
  Spa as SpaIcon,
  SportsSoccer as SportsSoccerIcon,
  Lightbulb as LightbulbIcon,
} from '@mui/icons-material';
import type { SvgIconComponent } from '@mui/icons-material';
import { Autocomplete, Box, Paper, TextField, Typography } from '@mui/material';
import type { AdFormValues, AttributeOption, UpdateFn } from './types';
import { sectionSx, sectionTitleSx } from './types';

const ATTRIBUTE_ICON_MAP: Record<string, SvgIconComponent> = {
  Wifi: WifiIcon,
  Pool: PoolIcon,
  LocalParking: ParkingIcon,
  AcUnit: AcUnitIcon,
  Elevator: ElevatorIcon,
  Kitchen: KitchenIcon,
  Yard: YardIcon,
  Fireplace: FireplaceIcon,
  FitnessCenter: FitnessCenterIcon,
  Security: SecurityIcon,
  LocalLaundryService: LaundryServiceIcon,
  Tv: TvIcon,
  Balcony: BalconyIcon,
  BalconyOutlined: BalconyIcon,
  WaterDrop: WaterDropIcon,
  ElectricBolt: ElectricBoltIcon,
  Garage: GarageIcon,
  DirectionsCar: DirectionsCarIcon,
  Bathtub: BathtubIcon,
  Bed: BedIcon,
  Shower: ShowerIcon,
  LocalBar: LocalBarIcon,
  LocalCafe: LocalCafeIcon,
  Deck: DeckIcon,
  Fence: FenceIcon,
  Alarm: AlarmIcon,
  Roofing: RoofingIcon,
  Spa: SpaIcon,
  SportsSoccer: SportsSoccerIcon,
  CheckCircle: CheckCircleIcon,
  Lightbulb: LightbulbIcon,
};

const getAttributeIcon = (iconName?: string): SvgIconComponent => {
  if (!iconName) return CheckCircleOutlineIcon;
  const cleaned = iconName.replace(/^heroicon-[o-s]-/, '');
  return ATTRIBUTE_ICON_MAP[iconName] ?? ATTRIBUTE_ICON_MAP[cleaned] ?? CheckCircleOutlineIcon;
};

interface AdFormEquipmentProps {
  values: AdFormValues;
  update: UpdateFn;
  autocompleteOptions: AttributeOption[];
}

export default function AdFormEquipment({ values, update, autocompleteOptions }: AdFormEquipmentProps) {
  if (autocompleteOptions.length === 0) return null;

  return (
    <Paper elevation={0} sx={sectionSx}>
      <Typography variant="subtitle1" sx={{ ...sectionTitleSx, display: 'flex', alignItems: 'center', gap: 1 }}>
        <CheckCircleIcon sx={{ color: 'primary.main', fontSize: 22 }} />
        Équipements & Services
      </Typography>
      <Autocomplete
        multiple
        options={autocompleteOptions}
        groupBy={(option) => option.group}
        getOptionLabel={(option) => option.label}
        value={values.attributes
          .map((v) => autocompleteOptions.find((a) => a.value === v))
          .filter((a): a is AttributeOption => !!a)}
        onChange={(_, newValue) => {
          update('attributes', newValue.map((opt) => opt.value));
        }}
        isOptionEqualToValue={(opt, val) => opt.value === val.value}
        renderOption={(props, option) => {
          const IconC = getAttributeIcon(option.icon);
          return (
            <li {...props} key={option.value}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconC sx={{ fontSize: 20, color: 'text.secondary' }} />
                {option.label}
              </Box>
            </li>
          );
        }}
        renderInput={(params) => (
          <TextField
            {...params}
            placeholder="Rechercher et sélectionner des équipements…"
            size="small"
            label="Équipements"
          />
        )}
        sx={{ maxWidth: 420 }}
        slotProps={{ paper: { sx: { maxHeight: 320 } } }}
      />
    </Paper>
  );
}
