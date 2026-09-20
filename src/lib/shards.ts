// //////////////////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////////////////////////////////////////////////////////////////////////////
// Shard routing

/**
 * One generated shard of a dataset.
 *
 * Games split their data differently. GFL shards by numeric id range, so `holds` is a comparison. Arknights ids are strings such as
 * `char_002_amiya`, and its natural axis is the operator's class, so `holds` is a lookup. Keeping the test as a function is what lets one
 * resolver serve both, rather than the kit assuming ids are numbers.
 */
export interface Shard<K> {
	/** The shard's file, named the way the data store's `urls` keys it. */
	file: string;
	/** Whether this shard is the one holding `key`. */
	holds: (key: K) => boolean;
}

/**
 * The shard holding one key.
 *
 * A table that must never miss should end in a catch-all whose `holds` returns true, the way GFL's ends at `Number.POSITIVE_INFINITY`. Without
 * one a key outside every shard returns null, which `strict` then forces the caller to handle - better than GFL, which clamped a bad id into
 * the last shard and loaded the wrong data.
 *
 * @param shards The shard table, in the order it should be tested.
 * @param key The key to place.
 * @returns The first shard that claims the key, or null when none does.
 */
export function shardFor<K>(shards: readonly Shard<K>[], key: K): Shard<K> | null {
	return shards.find((shard) => shard.holds(key)) ?? null;
}
