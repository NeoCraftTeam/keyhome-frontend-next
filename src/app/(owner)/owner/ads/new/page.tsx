'use client';

import { Box, Container, Typography } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import AdForm, {
  type AdFormValues,
  type TourScene,
} from '@/components/owner/AdForm';
import { adsService } from '@/services/ads.service';

export default function OwnerNewAdPage() {
  const router = useRouter();
  const createMutation = useMutation({
    mutationFn: async ({
      values,
      images,
      tourScenes,
      propertyConditionPdf,
    }: {
      values: AdFormValues;
      images: File[];
      tourScenes?: TourScene[];
      propertyConditionPdf?: File | null;
    }) => {
      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('adresse', values.adresse);
      formData.append('price', values.price);
      formData.append('surface_area', values.surface_area);
      formData.append('bedrooms', values.bedrooms);
      formData.append('bathrooms', values.bathrooms);
      formData.append('has_parking', values.has_parking ? '1' : '0');
      formData.append('latitude', String(values.latitude));
      formData.append('longitude', String(values.longitude));
      formData.append('quarter_id', values.quarter_id);
      formData.append('type_id', values.type_id);
      values.attributes.forEach((a) => formData.append('attributes[]', a));
      images.forEach((f, i) => formData.append(`images[${i}]`, f));

      // Premium info
      if (values.deposit_amount)
        formData.append('deposit_amount', values.deposit_amount);
      if (values.minimum_lease_duration)
        formData.append(
          'minimum_lease_duration',
          values.minimum_lease_duration
        );
      formData.append(
        'charges_forfaitaires',
        values.charges_forfaitaires ? '1' : '0'
      );
      if (values.charges_forfaitaires && values.charges_montant_forfait) {
        formData.append(
          'charges_montant_forfait',
          values.charges_montant_forfait
        );
      }
      if (!values.charges_forfaitaires) {
        if (values.charges_eau)
          formData.append('charges_eau', values.charges_eau);
        if (values.charges_electricite)
          formData.append('charges_electricite', values.charges_electricite);
      }
      if (values.charges_autres)
        formData.append('charges_autres', values.charges_autres);

      // Proximity & distance fields
      if (values.distance_main_road_m)
        formData.append('distance_main_road_m', values.distance_main_road_m);
      if (values.distance_shops_m)
        formData.append('distance_shops_m', values.distance_shops_m);
      if (values.distance_transport_m)
        formData.append('distance_transport_m', values.distance_transport_m);
      if (values.distance_school_m)
        formData.append('distance_school_m', values.distance_school_m);
      if (values.distance_hospital_m)
        formData.append('distance_hospital_m', values.distance_hospital_m);

      // Property condition PDF
      if (propertyConditionPdf) {
        formData.append('property_condition', propertyConditionPdf);
      }

      if (values.is_boost_requested) {
        formData.append('is_boost_requested', '1');
      }

      const ad = await adsService.create(formData);

      // Upload tour scenes if any — clean up orphan ad on failure
      if (tourScenes && tourScenes.length > 0) {
        const validScenes = tourScenes.filter((s) => s.file && s.title.trim());
        if (validScenes.length > 0) {
          try {
            await adsService.uploadTourScenes(
              ad.id,
              validScenes.map((s) => ({
                title: s.title,
                image: s.file!,
                clientId: s.id,
                hotspots: s.hotspots?.map((h) => ({
                  pitch: h.pitch,
                  yaw: h.yaw,
                  target_scene: h.target_scene,
                  label: h.label,
                })),
              }))
            );
          } catch (scenesError) {
            // Roll back: delete the orphan ad so DB stays consistent
            await adsService.destroy(ad.id).catch(() => {});
            throw scenesError;
          }
        }
      }

      return ad;
    },
    onSuccess: () => {
      router.push('/owner/ads');
    },
  });

  const handleSubmit = async (
    values: AdFormValues,
    images: File[],
    options?: {
      imagesToDelete?: number[];
      tourScenes?: TourScene[];
      propertyConditionPdf?: File | null;
    }
  ) => {
    await createMutation.mutateAsync({
      values,
      images,
      tourScenes: options?.tourScenes,
      propertyConditionPdf: options?.propertyConditionPdf,
    });
  };

  const handleEnhance = async (description: string) => {
    const { enhanced } = await adsService.enhanceDescription(description);
    return enhanced;
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Nouvelle annonce
      </Typography>
      <Typography color="text.secondary" sx={{ mb: 4 }}>
        Remplissez les champs pour créer votre annonce.
      </Typography>
      <Box>
        <AdForm
          onSubmit={handleSubmit}
          onCancel={() => router.back()}
          submitLabel="Créer l'annonce"
          isSubmitting={createMutation.isPending}
          onEnhanceDescription={handleEnhance}
        />
      </Box>
    </Container>
  );
}
